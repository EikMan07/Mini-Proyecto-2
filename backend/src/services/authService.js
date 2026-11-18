'use strict';

const {
  Colaborador,
  Departamento,
  SaldoVacaciones,
  Solicitud,
} = require('../models');
const {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require('../utils/errors');

const EMAILS_DEMO = [
  'diego.chaves@ticosoft.cr',
  'laura.jimenez@ticosoft.cr',
  'ana.solis@ticosoft.cr',
  'carlos.mora@ticosoft.cr',
];

async function registrarColaborador(datos) {
  const existente = await Colaborador.findOne({ where: { email: datos.email } });
  if (existente) {
    throw new ConflictError('Ese correo ya está registrado');
  }

  let departamentoId = datos.departamento_id;
  if (departamentoId) {
    const depto = await Departamento.findByPk(departamentoId);
    if (!depto) {
      throw new ValidationError('El departamento especificado no existe');
    }
  } else {
    const deptoDefault = await Departamento.findOne({ order: [['id', 'ASC']] });
    if (!deptoDefault) {
      throw new ValidationError('No existen departamentos configurados en la base de datos');
    }
    departamentoId = deptoDefault.id;
  }

  const codigoEmpleado = `EMP-${Date.now().toString().slice(-6)}`;
  const hoy = new Date().toISOString().slice(0, 10);

  const nuevo = await Colaborador.create({
    codigo_empleado: codigoEmpleado,
    nombre: datos.nombre,
    email: datos.email,
    password: datos.password,
    departamento_id: departamentoId,
    puesto: datos.puesto || 'Colaborador',
    fecha_ingreso: hoy,
    salario_base: '850000.00',
    perfil_acceso: 'colaborador',
    estado: 'activo',
  });

  const conDepto = await Colaborador.findByPk(nuevo.id, {
    include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] }],
  });

  return conDepto;
}

async function autenticarColaborador(email, password) {
  const colaborador = await Colaborador.scope('conPassword').findOne({
    where: { email },
    include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] }],
  });

  const valido = colaborador && (await colaborador.verificarPassword(password));
  if (!valido) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  if (colaborador.estado === 'inactivo') {
    throw new UnauthorizedError('La cuenta se encuentra inactiva');
  }

  return colaborador;
}

async function obtenerColaboradorPorId(id) {
  const colaborador = await Colaborador.findByPk(id, {
    include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] }],
  });

  if (!colaborador) {
    throw new NotFoundError('Colaborador');
  }

  return colaborador;
}

async function obtenerUsuariosDemo() {
  const colaboradores = await Colaborador.findAll({
    where: { email: EMAILS_DEMO },
    include: [
      { model: Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] },
      { model: SaldoVacaciones, as: 'saldosVacaciones', attributes: ['periodo', 'dias_disponibles'] },
      { model: Solicitud, as: 'solicitudes', attributes: ['id', 'tipo', 'estado'] },
    ],
    order: [['perfil_acceso', 'ASC'], ['id', 'ASC']],
  });

  const ordenMap = new Map(EMAILS_DEMO.map((em, idx) => [em, idx]));
  colaboradores.sort((a, b) => (ordenMap.get(a.email) ?? 99) - (ordenMap.get(b.email) ?? 99));

  return colaboradores.map((c) => {
    const json = c.toJSON();
    const saldo2026 = Array.isArray(c.saldosVacaciones)
      ? c.saldosVacaciones.find((s) => s.periodo === '2026')
      : null;
    const pendientes = Array.isArray(c.solicitudes)
      ? c.solicitudes.filter((s) => s.estado === 'pendiente').length
      : 0;

    return {
      id: json.id,
      codigo_empleado: json.codigo_empleado,
      nombre: json.nombre,
      email: json.email,
      rol: json.rol,
      puesto: json.puesto,
      departamento: json.departamento ? json.departamento.nombre : null,
      dias_vacaciones_disponibles: saldo2026 ? saldo2026.dias_disponibles : null,
      solicitudes_pendientes: pendientes,
      password_prueba: 'DemoRRHH2026!',
    };
  });
}

module.exports = {
  registrarColaborador,
  autenticarColaborador,
  obtenerColaboradorPorId,
  obtenerUsuariosDemo,
};
