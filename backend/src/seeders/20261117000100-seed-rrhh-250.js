'use strict';

const bcrypt = require('bcryptjs');

/**
 * Seeder determinista e idempotente para Mini-Proyecto-2:
 * - 6 departamentos
 * - 250 colaboradores (8 RRHH + 242 colaboradores)
 * - 250 saldos de vacaciones 2026 (>=18 con >20 días disponibles)
 * - 110 solicitudes de últimos 3 meses (>=14 pendientes, >=6 con >3 días sin respuesta)
 * - 32 incapacidades de últimos 3 meses (6 activas hoy)
 * - Asistencias de hoy (250 registros) y días previos (500 registros)
 * - 36 movimientos de personal de últimos 3 meses
 * - 45 logs iniciales en consultas_chat (incluyendo 4 escaladas/no resueltas)
 * - 1 reporte diario inicial en reportes_diarios
 * - IDs autoincrementales gestionados por MySQL/Sequelize
 */

function formatoFecha(date) {
  return date.toISOString().slice(0, 10);
}

function sumarDias(baseDate, dias) {
  const d = new Date(baseDate.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

function proximoViernes(baseDate) {
  const d = new Date(baseDate.getTime());
  const dia = d.getUTCDay(); // 0=Dom..5=Vie..6=Sab
  const diff = (5 - dia + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existingRows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS total FROM colaboradores;'
    );
    if (existingRows[0] && existingRows[0].total >= 250) {
      return;
    }

    const ahora = new Date();
    const hoyStr = formatoFecha(ahora);
    const viernesStr = formatoFecha(proximoViernes(ahora));
    const passwordHash = bcrypt.hashSync('DemoRRHH2026!', 10);

    // 1. Insertar 6 departamentos
    const deptosSeed = [
      { codigo: 'ING', nombre: 'Ingenieria y Tecnologia', created_at: ahora, updated_at: ahora },
      { codigo: 'RRHH', nombre: 'Recursos Humanos y Talento', created_at: ahora, updated_at: ahora },
      { codigo: 'OPS', nombre: 'Operaciones y Logistica', created_at: ahora, updated_at: ahora },
      { codigo: 'FIN', nombre: 'Finanzas y Contabilidad', created_at: ahora, updated_at: ahora },
      { codigo: 'SAC', nombre: 'Atencion al Cliente', created_at: ahora, updated_at: ahora },
      { codigo: 'VEN', nombre: 'Ventas y Comercial', created_at: ahora, updated_at: ahora },
    ];

    await queryInterface.bulkInsert('departamentos', deptosSeed);
    const [deptos] = await queryInterface.sequelize.query(
      'SELECT id, codigo, nombre FROM departamentos ORDER BY id ASC;'
    );
    const deptoPorCodigo = Object.fromEntries(deptos.map((d) => [d.codigo, d.id]));

    // 2. Generar exactamente 250 colaboradores deterministas
    const nombresPila = [
      'Alejandro', 'Andres', 'Camila', 'Carolina', 'Cristian', 'Daniel', 'Daniela',
      'Eduardo', 'Esteban', 'Fabian', 'Fernanda', 'Gabriel', 'Gabriela', 'Ignacio',
      'Isabella', 'Javier', 'Jose', 'Juliana', 'Karina', 'Kendall', 'Luis', 'Marcela',
      'Marco', 'Maria', 'Mariana', 'Mateo', 'Melissa', 'Natalia', 'Oscar', 'Pablo',
      'Paola', 'Paula', 'Rafael', 'Raquel', 'Ricardo', 'Roberto', 'Rodrigo', 'Sebastian',
      'Sofia', 'Tatiana', 'Valeria', 'Victor', 'Ximena', 'Yendry',
    ];
    const apellidos = [
      'Arias', 'Araya', 'Barquero', 'Brenes', 'Calderon', 'Campos', 'Carvajal',
      'Castro', 'Chacon', 'Chaves', 'Cordero', 'Corrales', 'Delgado', 'Esquivel',
      'Fallas', 'Fernandez', 'Fonseca', 'Gamboa', 'Garcia', 'Gonzalez', 'Guevara',
      'Gutierrez', 'Hernandez', 'Herrera', 'Jimenez', 'Leiton', 'Lopez', 'Madrigal',
      'Marin', 'Mata', 'Mendez', 'Monge', 'Montero', 'Mora', 'Morales', 'Murillo',
      'Navarro', 'Nunez', 'Obando', 'Ortiz', 'Pacheco', 'Perez', 'Quesada', 'Quiros',
      'Ramirez', 'Rojas', 'Rodriguez', 'Ruiz', 'Salas', 'Salazar', 'Sanchez', 'Segura',
      'Serrano', 'Solano', 'Solis', 'Soto', 'Ulate', 'Umana', 'Vargas', 'Vega',
      'Villalobos', 'Zamora', 'Zuniga',
    ];

    const puestosPorDepto = {
      ING: ['Desarrollador Backend', 'Desarrollador Frontend', 'Ingeniero QA', 'Arquitecto Cloud', 'Analista DevOps', 'Ingeniero de Datos'],
      RRHH: ['Especialista de Talento', 'Analista de Nomina', 'Generalista RRHH', 'Coordinador de Cultura'],
      OPS: ['Analista de Operaciones', 'Coordinador Logistico', 'Supervisor de Procesos', 'Especialista de Cadena'],
      FIN: ['Contador General', 'Analista Financiero', 'Especialista de Tesoreria', 'Auditor Interno'],
      SAC: ['Agente de Soporte', 'Especialista de Experiencia', 'Lider de Servicio', 'Analista de Calidad'],
      VEN: ['Ejecutivo de Cuenta', 'Asesor Comercial', 'Especialista B2B', 'Coordinador de Ventas'],
    };

    const codigosDepto = ['ING', 'OPS', 'FIN', 'SAC', 'VEN', 'RRHH'];
    const correosUsados = new Set();

    const cuentasFijas = [
      // 2 RRHH Demo principales
      {
        codigo_empleado: 'EMP-0001',
        nombre: 'Ana Solis Vargas',
        email: 'ana.solis@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Gerente de Talento Humano',
        fecha_ingreso: '2020-02-10',
        salario_base: '2450000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0002',
        nombre: 'Carlos Mora Quesada',
        email: 'carlos.mora@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Especialista de Nomina y Beneficios',
        fecha_ingreso: '2021-05-17',
        salario_base: '1650000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      // 6 RRHH adicionales (total = 8 RRHH)
      {
        codigo_empleado: 'EMP-0003',
        nombre: 'Sofia Castro Mendez',
        email: 'sofia.castro@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Generalista de Recursos Humanos',
        fecha_ingreso: '2022-03-01',
        salario_base: '1380000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0004',
        nombre: 'Andres Vega Villalobos',
        email: 'andres.vega@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Coordinador de Bienestar Laboral',
        fecha_ingreso: '2022-08-15',
        salario_base: '1420000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0005',
        nombre: 'Valeria Campos Araya',
        email: 'valeria.campos@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Analista de Reclutamiento TI',
        fecha_ingreso: '2023-01-16',
        salario_base: '1290000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0006',
        nombre: 'Roberto Acuna Solano',
        email: 'roberto.acuna@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Especialista en Salud Ocupacional',
        fecha_ingreso: '2023-06-05',
        salario_base: '1350000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0007',
        nombre: 'Mariana Salas Fonseca',
        email: 'mariana.salas@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Analista de Capacitacion',
        fecha_ingreso: '2024-02-12',
        salario_base: '1240000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0008',
        nombre: 'Esteban Nunez Cordero',
        email: 'esteban.nunez@ticosoft.cr',
        depto: 'RRHH',
        puesto: 'Asistente de Gestion Humana',
        fecha_ingreso: '2024-09-02',
        salario_base: '980000.00',
        perfil_acceso: 'rrhh',
        estado: 'activo',
      },
      // 2 Colaboradores Demo principales
      {
        codigo_empleado: 'EMP-0009',
        nombre: 'Diego Chaves Alpizar',
        email: 'diego.chaves@ticosoft.cr',
        depto: 'ING',
        puesto: 'Desarrollador Backend Senior',
        fecha_ingreso: '2021-01-11',
        salario_base: '2150000.00',
        perfil_acceso: 'colaborador',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0010',
        nombre: 'Laura Jimenez Ulate',
        email: 'laura.jimenez@ticosoft.cr',
        depto: 'OPS',
        puesto: 'Analista de Operaciones',
        fecha_ingreso: '2023-04-03',
        salario_base: '1180000.00',
        perfil_acceso: 'colaborador',
        estado: 'activo',
      },
      // Casos para preguntas restringidas #21 y #22
      {
        codigo_empleado: 'EMP-0011',
        nombre: 'Juan Rojas Mendez',
        email: 'juan.rojas@ticosoft.cr',
        depto: 'FIN',
        puesto: 'Analista Financiero Senior',
        fecha_ingreso: '2022-07-18',
        salario_base: '1540000.00',
        perfil_acceso: 'colaborador',
        estado: 'activo',
      },
      {
        codigo_empleado: 'EMP-0012',
        nombre: 'Ricardo Brenes Monge',
        email: 'ricardo.brenes@ticosoft.cr',
        depto: 'ING',
        puesto: 'Gerente General',
        fecha_ingreso: '2019-01-07',
        salario_base: '3850000.00',
        perfil_acceso: 'colaborador',
        estado: 'activo',
      },
    ];

    const colaboradoresData = [];
    for (const c of cuentasFijas) {
      correosUsados.add(c.email);
      colaboradoresData.push({
        codigo_empleado: c.codigo_empleado,
        nombre: c.nombre,
        email: c.email,
        password: passwordHash,
        departamento_id: deptoPorCodigo[c.depto],
        puesto: c.puesto,
        fecha_ingreso: c.fecha_ingreso,
        salario_base: c.salario_base,
        jefe_id: null,
        perfil_acceso: c.perfil_acceso,
        estado: c.estado,
        created_at: ahora,
        updated_at: ahora,
      });
    }

    // Completar hasta 250 colaboradores (238 adicionales, todos con perfil_acceso = 'colaborador')
    for (let i = 13; i <= 250; i += 1) {
      const nIdx = (i * 7) % nombresPila.length;
      const a1Idx = (i * 11) % apellidos.length;
      const a2Idx = (i * 17 + 3) % apellidos.length;
      const nombre = `${nombresPila[nIdx]} ${apellidos[a1Idx]} ${apellidos[a2Idx]}`;

      const deptoCod = codigosDepto[i % 5]; // Distribuidos entre ING, OPS, FIN, SAC, VEN
      const listaPuestos = puestosPorDepto[deptoCod];
      const puesto = listaPuestos[i % listaPuestos.length];

      const baseSlug = `${nombresPila[nIdx].toLowerCase()}.${apellidos[a1Idx].toLowerCase()}`;
      let email = `${baseSlug}@ticosoft.cr`;
      if (correosUsados.has(email)) {
        email = `${baseSlug}.${i}@ticosoft.cr`;
      }
      correosUsados.add(email);

      const anio = 2020 + (i % 6);
      const mes = String(1 + (i % 12)).padStart(2, '0');
      const dia = String(1 + (i % 27)).padStart(2, '0');
      const fechaIngreso = `${anio}-${mes}-${dia}`;

      const salarioNum = 680000 + ((i * 47) % 19) * 95000;
      let estado = 'activo';
      if (i >= 241 && i <= 246) estado = 'incapacidad';
      else if (i >= 247 && i <= 250) estado = 'vacaciones';

      colaboradoresData.push({
        codigo_empleado: `EMP-${String(i).padStart(4, '0')}`,
        nombre,
        email,
        password: passwordHash,
        departamento_id: deptoPorCodigo[deptoCod],
        puesto,
        fecha_ingreso: fechaIngreso,
        salario_base: salarioNum.toFixed(2),
        jefe_id: null,
        perfil_acceso: 'colaborador',
        estado,
        created_at: ahora,
        updated_at: ahora,
      });
    }

    await queryInterface.bulkInsert('colaboradores', colaboradoresData);
    const [colaboradoresDB] = await queryInterface.sequelize.query(
      'SELECT id, codigo_empleado, email, departamento_id, puesto, estado FROM colaboradores ORDER BY id ASC;'
    );

    const porEmail = Object.fromEntries(colaboradoresDB.map((c) => [c.email, c]));
    const gerenteGeneral = porEmail['ricardo.brenes@ticosoft.cr'];
    const anaSolis = porEmail['ana.solis@ticosoft.cr'];

    // Asignar jefe_id (Gerente General como jefe de RRHH/líderes, y líderes de cada depto para el resto)
    const liderPorDepto = {};
    for (const c of colaboradoresDB) {
      if (c.id !== gerenteGeneral.id && !liderPorDepto[c.departamento_id]) {
        liderPorDepto[c.departamento_id] = c.id;
      }
    }

    for (const c of colaboradoresDB) {
      if (c.id === gerenteGeneral.id) continue;
      const jefeId = liderPorDepto[c.departamento_id] === c.id ? gerenteGeneral.id : liderPorDepto[c.departamento_id];
      await queryInterface.sequelize.query(
        'UPDATE colaboradores SET jefe_id = :jefeId WHERE id = :id;',
        { replacements: { jefeId, id: c.id } }
      );
    }

    // 3. 250 Saldos de Vacaciones (periodo '2026'), >=18 con >20 días disponibles
    const saldosData = colaboradoresDB.map((c, idx) => {
      if (c.email === 'diego.chaves@ticosoft.cr') {
        return {
          colaborador_id: c.id,
          periodo: '2026',
          dias_asignados: 24,
          dias_tomados: 0,
          dias_disponibles: 24,
          created_at: ahora,
          updated_at: ahora,
        };
      }
      // 21 colaboradores adicionales (índices 15..35) con 21..28 días disponibles (total = 22 con >20 días)
      if (idx >= 15 && idx <= 35) {
        const disponibles = 21 + (idx % 8); // 21 a 28
        const tomados = idx % 3;
        return {
          colaborador_id: c.id,
          periodo: '2026',
          dias_asignados: disponibles + tomados,
          dias_tomados: tomados,
          dias_disponibles: disponibles,
          created_at: ahora,
          updated_at: ahora,
        };
      }
      const asignados = 12 + (idx % 7); // 12 a 18
      const tomados = idx % 6; // 0 a 5
      return {
        colaborador_id: c.id,
        periodo: '2026',
        dias_asignados: asignados,
        dias_tomados: tomados,
        dias_disponibles: Math.max(1, asignados - tomados),
        created_at: ahora,
        updated_at: ahora,
      };
    });
    await queryInterface.bulkInsert('saldos_vacaciones', saldosData);

    // 4. Solicitudes de los últimos 3 meses (110 registros, >=14 pendientes, >=6 con >3 días sin respuesta)
    const tiposSolicitud = [
      'vacaciones',
      'permiso_con_goce',
      'permiso_sin_goce',
      'licencia_duelo',
      'licencia_paternidad',
      'estudio',
    ];
    const solicitudesData = [];

    // Solicitud para el próximo viernes del colaborador demo principal y la segunda cuenta demo
    solicitudesData.push({
      colaborador_id: porEmail['diego.chaves@ticosoft.cr'].id,
      tipo: 'permiso_con_goce',
      fecha_inicio: viernesStr,
      fecha_fin: viernesStr,
      dias_solicitados: 1,
      motivo: 'Permiso para el viernes por cita medica programada en CCSS',
      estado: 'aprobada',
      aprobador_id: anaSolis.id,
      creada_en: sumarDias(ahora, -2),
      created_at: ahora,
      updated_at: ahora,
    });
    solicitudesData.push({
      colaborador_id: porEmail['laura.jimenez@ticosoft.cr'].id,
      tipo: 'permiso_con_goce',
      fecha_inicio: viernesStr,
      fecha_fin: viernesStr,
      dias_solicitados: 1,
      motivo: 'Permiso el viernes para tramite personal y renovacion de cedula',
      estado: 'pendiente',
      aprobador_id: null,
      creada_en: sumarDias(ahora, -5),
      created_at: ahora,
      updated_at: ahora,
    });

    // Completar 110 solicitudes totales (16 pendientes en total, 8 con >3 días sin respuesta)
    for (let s = 2; s < 110; s += 1) {
      const colab = colaboradoresDB[(s * 2 + 12) % colaboradoresDB.length];
      const tipo = tiposSolicitud[s % tiposSolicitud.length];
      const esPendiente = s < 17; // índices 1 (laura) + 2..16 = 16 pendientes
      const esAtrasada = s >= 2 && s <= 8; // + laura (5 días) = 8 solicitudes con >3 días sin respuesta

      const diasAtrasCreacion = esAtrasada
        ? 4 + (s % 6) // 4 a 9 días atrás
        : esPendiente
          ? 1 + (s % 2)
          : 5 + (s % 80); // últimos ~3 meses

      const creadaEn = sumarDias(ahora, -diasAtrasCreacion);
      const fechaIni = esPendiente ? sumarDias(ahora, 3 + (s % 10)) : sumarDias(ahora, -(diasAtrasCreacion - 2));
      const diasSol = 1 + (s % 4);
      const fechaFin = sumarDias(fechaIni, diasSol - 1);

      const estado = esPendiente ? 'pendiente' : s % 5 === 0 ? 'rechazada' : 'aprobada';

      solicitudesData.push({
        colaborador_id: colab.id,
        tipo,
        fecha_inicio: formatoFecha(fechaIni),
        fecha_fin: formatoFecha(fechaFin),
        dias_solicitados: diasSol,
        motivo: `Solicitud de ${tipo.replace(/_/g, ' ')} registrada para gestion de RRHH`,
        estado,
        aprobador_id: esPendiente ? null : anaSolis.id,
        creada_en: creadaEn,
        created_at: ahora,
        updated_at: ahora,
      });
    }
    await queryInterface.bulkInsert('solicitudes', solicitudesData);

    // 5. Incapacidades (32 registros en últimos 3 meses, incluyendo 6 activas hoy)
    const incapacidadesData = [];
    const tiposInc = ['enfermedad_comun', 'accidente_laboral', 'maternidad'];
    const entidadesInc = ['CCSS', 'INS', 'Clinica Privada'];

    for (let k = 0; k < 32; k += 1) {
      const esActiva = k < 6;
      const colab = esActiva
        ? colaboradoresDB[240 + k] // EMP-0241 .. EMP-0246 en estado 'incapacidad'
        : colaboradoresDB[(k * 7 + 14) % 235];

      const dias = esActiva ? 3 + (k % 5) : 2 + (k % 7);
      const fechaIni = esActiva ? sumarDias(ahora, -1) : sumarDias(ahora, -(10 + k * 2));
      const fechaFin = sumarDias(fechaIni, dias - 1);
      const entidad = k % 4 === 0 ? 'INS' : entidadesInc[k % 2 === 0 ? 0 : 1];

      incapacidadesData.push({
        colaborador_id: colab.id,
        tipo: tiposInc[k % tiposInc.length],
        fecha_inicio: formatoFecha(fechaIni),
        fecha_fin: formatoFecha(fechaFin),
        dias,
        entidad,
        numero_boleta: `${entidad}-2026-${String(1000 + k)}`,
        comprobante_url: `/uploads/comprobantes/boleta-${1000 + k}.pdf`,
        estado: esActiva ? 'activa' : 'finalizada',
        created_at: ahora,
        updated_at: ahora,
      });
    }
    await queryInterface.bulkInsert('incapacidades', incapacidadesData);

    // 6. Asistencias de hoy (250 registros) y 2 días previos (500 registros)
    const asistenciasData = [];
    for (let idx = 0; idx < colaboradoresDB.length; idx += 1) {
      const c = colaboradoresDB[idx];
      let estado = 'presente';
      let horaEntrada = `08:${String(idx % 15).padStart(2, '0')}:00`;
      const modalidad = idx % 3 === 0 ? 'teletrabajo' : 'presencial';
      let comprobanteUrl = null;
      let entidadComprobante = null;
      let observacion = null;

      if (c.estado === 'incapacidad') {
        estado = 'justificada';
        horaEntrada = null;
        comprobanteUrl = `/uploads/comprobantes/incapacidad-${c.codigo_empleado}.pdf`;
        entidadComprobante = idx % 2 === 0 ? 'CCSS' : 'INS';
        observacion = 'Ausencia justificada por incapacidad activa';
      } else if (c.estado === 'vacaciones') {
        estado = 'justificada';
        horaEntrada = null;
        observacion = 'Ausencia justificada por vacaciones aprobadas';
      } else if (idx >= 228 && idx < 240) {
        estado = 'ausente';
        horaEntrada = null;
        observacion = 'Sin marca registrada hasta el momento';
      }

      asistenciasData.push({
        colaborador_id: c.id,
        fecha: hoyStr,
        hora_entrada: horaEntrada,
        modalidad,
        estado,
        comprobante_url: comprobanteUrl,
        entidad_comprobante: entidadComprobante,
        observacion,
        created_at: ahora,
        updated_at: ahora,
      });
    }

    // Días previos para histórico reciente (ayer y anteayer)
    for (const offset of [-1, -2]) {
      const fechaDia = formatoFecha(sumarDias(ahora, offset));
      for (let idx = 0; idx < colaboradoresDB.length; idx += 1) {
        const c = colaboradoresDB[idx];
        const esAusente = (idx + Math.abs(offset)) % 25 === 0;
        asistenciasData.push({
          colaborador_id: c.id,
          fecha: fechaDia,
          hora_entrada: esAusente ? null : `07:${String(50 + (idx % 10)).padStart(2, '0')}:00`,
          modalidad: idx % 3 === 0 ? 'teletrabajo' : 'presencial',
          estado: esAusente ? 'justificada' : 'presente',
          comprobante_url: esAusente ? `/uploads/comprobantes/justificacion-${c.codigo_empleado}.pdf` : null,
          entidad_comprobante: esAusente ? 'Clinica' : null,
          observacion: esAusente ? 'Permiso justificado' : null,
          created_at: ahora,
          updated_at: ahora,
        });
      }
    }
    await queryInterface.bulkInsert('asistencias', asistenciasData);

    // 7. Movimientos de personal (36 registros en últimos 3 meses)
    const movimientosData = [];
    for (let m = 0; m < 36; m += 1) {
      const colab = colaboradoresDB[(m * 6 + 10) % colaboradoresDB.length];
      let tipo = 'ingreso';
      let motivo = 'Contratacion para fortalecimiento operativo del area';
      let puestoAnterior = null;
      let puestoNuevo = colab.puesto;

      if (m % 5 === 0) {
        tipo = 'salida';
        motivo = 'Renuncia voluntaria por nueva oportunidad profesional';
        puestoAnterior = colab.puesto;
        puestoNuevo = null;
      } else if (m % 3 === 0) {
        tipo = 'ascenso';
        motivo = 'Promocion interna por evaluacion sobresaliente de desempeno';
        puestoAnterior = `Junior ${colab.puesto}`;
        puestoNuevo = `Senior ${colab.puesto}`;
      }

      movimientosData.push({
        colaborador_id: colab.id,
        tipo,
        fecha: formatoFecha(sumarDias(ahora, -(m * 2 + 2))),
        motivo,
        puesto_anterior: puestoAnterior,
        puesto_nuevo: puestoNuevo,
        created_at: ahora,
        updated_at: ahora,
      });
    }
    await queryInterface.bulkInsert('movimientos_personal', movimientosData);

    // 8. Logs iniciales en consultas_chat (45 consultas, incluyendo 4 escaladas/no resueltas)
    const preguntasPorTema = {
      vacaciones: [
        'Cuantos dias de vacaciones me corresponden por ley en Costa Rica tras cumplir un ano?',
        'Puedo acumular mas de dos periodos de vacaciones?',
        'Con cuantos dias de anticipacion debo solicitar vacaciones?',
      ],
      aguinaldo: [
        'Cuando se deposita el aguinaldo en TicoSoft y como se calcula?',
        'Las horas extra y comisiones entran en el calculo del aguinaldo?',
      ],
      incapacidades: [
        'Como paga la empresa y la CCSS los primeros tres dias de incapacidad?',
        'Donde subo la boleta de incapacidad del INS?',
      ],
      teletrabajo: [
        'Cuantos dias de teletrabajo a la semana permite la politica vigente?',
        'Cuales son los requisitos ergonomicos para solicitar teletrabajo?',
      ],
      permisos: [
        'Cuantos dias de licencia con goce corresponden por paternidad o duelo?',
        'Como solicito un permiso con goce para cita medica en la CCSS?',
      ],
    };

    const temas = ['vacaciones', 'aguinaldo', 'incapacidades', 'teletrabajo', 'permisos'];
    const consultasData = [];

    for (let q = 0; q < 41; q += 1) {
      const colab = colaboradoresDB[(q * 5 + 8) % colaboradoresDB.length];
      const tema = temas[q % temas.length];
      const opcionesPregunta = preguntasPorTema[tema];
      const pregunta = opcionesPregunta[q % opcionesPregunta.length];
      const intencion = q % 4 === 0 ? 'mixta' : q % 3 === 0 ? 'dato_personal' : 'politica';
      const agente = intencion === 'dato_personal' ? 'Agente de Datos Personales' : 'Agente de Politicas RAG';

      consultasData.push({
        colaborador_id: colab.id,
        pregunta,
        respuesta: `Respuesta verificada conforme al Reglamento Interno de TicoSoft (${tema}).`,
        tema,
        intencion,
        agente,
        documentos_citados: JSON.stringify([
          {
            titulo: `Politica Oficial de ${tema.charAt(0).toUpperCase() + tema.slice(1)}`,
            seccion: 'Seccion 3.1 - Disposiciones Generales',
            version: 'v2.0',
          },
        ]),
        similitud_maxima: (0.76 + (q % 18) * 0.01).toFixed(4),
        resuelta: true,
        escalada: false,
        latencia_ms: 420 + (q * 37) % 650,
        fecha: sumarDias(ahora, -(q % 7)),
        created_at: ahora,
        updated_at: ahora,
      });
    }

    // 4 preguntas no resueltas / escaladas a RRHH
    const preguntasEscaladas = [
      {
        tema: 'beneficios',
        pregunta: 'La empresa otorga bono mensual por adopcion o cuidado de mascotas?',
        respuesta: 'No encontre una politica vigente sobre bono por mascotas en el repositorio oficial. He escalado tu consulta al equipo de RRHH.',
      },
      {
        tema: 'beneficios',
        pregunta: 'Existe convenio de guarderia infantil subsidiada para hijos de colaboradores?',
        respuesta: 'No consta en las politicas indexadas un convenio activo de guarderia infantil. Tu consulta fue escalada a RRHH para confirmacion.',
      },
      {
        tema: 'compensacion',
        pregunta: 'Se cubre el 100% de maestrias en el extranjero para personal con menos de 6 meses?',
        respuesta: 'Los documentos vigentes no contemplan financiamiento internacional antes de los 6 meses. Se escalo a RRHH.',
      },
      {
        tema: 'movilidad',
        pregunta: 'La empresa financia el marchamo de vehiculos personales fuera de la flota comercial?',
        respuesta: 'No existe politica documentada que cubra marchamo de vehiculos particulares. Consulta escalada a RRHH.',
      },
    ];

    for (let e = 0; e < preguntasEscaladas.length; e += 1) {
      const colab = colaboradoresDB[20 + e];
      const item = preguntasEscaladas[e];
      consultasData.push({
        colaborador_id: colab.id,
        pregunta: item.pregunta,
        respuesta: item.respuesta,
        tema: item.tema,
        intencion: 'politica',
        agente: 'Agente de Politicas RAG',
        documentos_citados: JSON.stringify([]),
        similitud_maxima: '0.3800',
        resuelta: false,
        escalada: true,
        latencia_ms: 610 + e * 45,
        fecha: sumarDias(ahora, -(e % 3)),
        created_at: ahora,
        updated_at: ahora,
      });
    }
    await queryInterface.bulkInsert('consultas_chat', consultasData);

    // 9. Primer reporte en reportes_diarios
    const reporteDatos = {
      total_colaboradores: 250,
      presentes_hoy: 228,
      teletrabajo_hoy: 76,
      presencial_hoy: 152,
      ausentes_sin_justificar_hoy: 12,
      incapacidades_activas: 6,
      solicitudes_pendientes: 16,
      solicitudes_pendientes_mas_3_dias: 8,
      colaboradores_riesgo_pasivo_vacaciones: 22,
      consultas_totales_semana: 45,
      consultas_escaladas: 4,
      top_temas: ['vacaciones', 'aguinaldo', 'incapacidades', 'teletrabajo', 'permisos'],
    };

    await queryInterface.bulkInsert('reportes_diarios', [
      {
        fecha: hoyStr,
        datos_json: JSON.stringify(reporteDatos),
        resumen_texto:
          'Reporte Ejecutivo Diario RRHH: 250 colaboradores activos en 6 departamentos. ' +
          'Se registran 22 colaboradores con mas de 20 dias de vacaciones acumulados (riesgo de pasivo laboral), ' +
          '8 solicitudes pendientes con mas de 3 dias sin respuesta, 6 incapacidades activas hoy y 4 consultas escaladas en el chat RAG.',
        generado_por: 'Agente Analista Diario',
        created_at: ahora,
        updated_at: ahora,
      },
    ]);

    // MySQL mantiene automáticamente el siguiente valor de AUTO_INCREMENT.
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('reportes_diarios', null, {});
    await queryInterface.bulkDelete('consultas_chat', null, {});
    await queryInterface.bulkDelete('movimientos_personal', null, {});
    await queryInterface.bulkDelete('asistencias', null, {});
    await queryInterface.bulkDelete('incapacidades', null, {});
    await queryInterface.bulkDelete('solicitudes', null, {});
    await queryInterface.bulkDelete('saldos_vacaciones', null, {});
    await queryInterface.bulkDelete('colaboradores', null, {});
    await queryInterface.bulkDelete('departamentos', null, {});
  },
};
