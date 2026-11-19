'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
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

function generarCodigoDepto(nombre) {
  const base = String(nombre || 'DEP')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
  const sufijo = Date.now().toString().slice(-4);
  return `${base || 'DEP'}-${sufijo}`;
}

async function resolverDepartamentoId(datos, transaction) {
  if (datos.departamento_id) {
    const depto = await Departamento.findByPk(datos.departamento_id, { transaction });
    if (!depto) {
      throw new ValidationError('El departamento especificado no existe');
    }
    return depto.id;
  }

  const nombreDepto = String(datos.department || '').trim();
  if (nombreDepto) {
    let depto = await Departamento.findOne({
      where: { nombre: { [Op.iLike]: nombreDepto } },
      transaction,
    });
    if (!depto) {
      depto = await Departamento.findOne({
        where: { nombre: { [Op.iLike]: `%${nombreDepto}%` } },
        transaction,
      });
    }
    if (!depto) {
      depto = await Departamento.create(
        {
          codigo: generarCodigoDepto(nombreDepto),
          nombre: nombreDepto.slice(0, 100),
          activo: true,
        },
        { transaction }
      );
    }
    return depto.id;
  }

  const deptoDefault = await Departamento.findOne({
    order: [['id', 'ASC']],
    transaction,
  });
  if (!deptoDefault) {
    throw new ValidationError('No existen departamentos configurados en la base de datos');
  }
  return deptoDefault.id;
}

async function registrarColaborador(datos) {
  const nombre = (
    datos.nombre || [datos.firstName, datos.lastName].filter(Boolean).join(' ')
  ).trim();

  const cedulaLimpia = datos.cedula
    ? String(datos.cedula).replace(/\D/g, '').slice(0, 20) || String(datos.cedula).trim().slice(0, 20)
    : null;

  const existenteEmail = await Colaborador.findOne({ where: { email: datos.email } });
  if (existenteEmail) {
    throw new ConflictError('Ese correo ya está registrado');
  }

  if (cedulaLimpia) {
    const existenteCedula = await Colaborador.findOne({ where: { cedula: cedulaLimpia } });
    if (existenteCedula) {
      throw new ConflictError('Esa cédula ya está registrada');
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const codigoEmpleado = `EMP-${Date.now().toString().slice(-6)}`;
  const puestoFinal = (datos.position || datos.puesto || 'Colaborador').trim().slice(0, 120);
  const terminosFecha = datos.termsAcceptedAt ? new Date(datos.termsAcceptedAt) : new Date();

  let nuevoId;
  try {
    nuevoId = await sequelize.transaction(async (transaction) => {
      const departamentoId = await resolverDepartamentoId(datos, transaction);

      const nuevo = await Colaborador.create(
        {
          codigo_empleado: codigoEmpleado,
          nombre: nombre.slice(0, 120),
          apellidos: datos.lastName ? String(datos.lastName).trim().slice(0, 120) : null,
          email: datos.email,
          password: datos.password,
          departamento_id: departamentoId,
          puesto: puestoFinal,
          fecha_ingreso: datos.startDate || hoy,
          salario_base: '850000.00',
          perfil_acceso: 'colaborador',
          estado: 'activo',
          cedula: cedulaLimpia,
          telefono: datos.phone || null,
          fecha_nacimiento: datos.birthDate || null,
          provincia: datos.province || null,
          canton: datos.canton || null,
          distrito: datos.district || null,
          direccion_exacta: datos.address || null,
          terminos_aceptados_en: Number.isNaN(terminosFecha.getTime()) ? new Date() : terminosFecha,
        },
        { transaction }
      );

      await SaldoVacaciones.create(
        {
          colaborador_id: nuevo.id,
          periodo: '2026',
          dias_asignados: 12,
          dias_tomados: 0,
          dias_disponibles: 12,
        },
        { transaction }
      );

      return nuevo.id;
    });
  } catch (error) {
    if (error.status) {
      throw error;
    }
    console.error('[authService.registrarColaborador Error SQL]:', error.message || error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.code === '23505') {
      throw new ConflictError('El correo o la cédula ya se encuentran registrados.');
    }
    throw new ValidationError('No fue posible completar el registro. Verifica los datos ingresados.');
  }

  return Colaborador.findByPk(nuevoId, {
    include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] }],
  });
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
