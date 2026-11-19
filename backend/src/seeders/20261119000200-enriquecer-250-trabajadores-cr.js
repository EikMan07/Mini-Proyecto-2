'use strict';

const bcrypt = require('bcryptjs');

const LUGARES_COSTA_RICA = [
  { provincia: 'San Jose', canton: 'Central', distrito: 'Carmen', senas: 'Del Parque Morazan 150 m este' },
  { provincia: 'San Jose', canton: 'Escazu', distrito: 'San Rafael', senas: 'Frente a Plaza Tempo, edificio B' },
  { provincia: 'San Jose', canton: 'Desamparados', distrito: 'San Antonio', senas: '200 m sur del parque central' },
  { provincia: 'Alajuela', canton: 'Central', distrito: 'San Jose', senas: '300 m oeste del Estadio Morera Soto' },
  { provincia: 'Alajuela', canton: 'San Carlos', distrito: 'Quesada', senas: '125 m norte de la Catedral' },
  { provincia: 'Cartago', canton: 'Central', distrito: 'Oriental', senas: '100 m sur de las Ruinas de Santiago' },
  { provincia: 'Cartago', canton: 'La Union', distrito: 'Tres Rios', senas: '250 m este de Terramall' },
  { provincia: 'Heredia', canton: 'Central', distrito: 'San Francisco', senas: '400 m norte de Oxigeno Human Playground' },
  { provincia: 'Heredia', canton: 'Belen', distrito: 'San Antonio', senas: '150 m oeste de la municipalidad' },
  { provincia: 'Guanacaste', canton: 'Liberia', distrito: 'Liberia', senas: '200 m sur del Parque Mario Canas' },
  { provincia: 'Guanacaste', canton: 'Nicoya', distrito: 'Nicoya', senas: '100 m este del templo colonial' },
  { provincia: 'Puntarenas', canton: 'Central', distrito: 'Barranca', senas: '300 m norte del cruce principal' },
  { provincia: 'Puntarenas', canton: 'Garabito', distrito: 'Jaco', senas: '150 m este de Avenida Pastor Diaz' },
  { provincia: 'Limon', canton: 'Central', distrito: 'Limon', senas: '200 m sur del Parque Vargas' },
  { provincia: 'Limon', canton: 'Pococi', distrito: 'Guapiles', senas: '175 m oeste de la terminal de buses' },
];

const NUEVOS_COLABORADORES_CR = [
  {
    codigo_empleado: 'EMP-0251',
    nombre: 'Camila Rojas Chinchilla',
    apellidos: 'Rojas Chinchilla',
    email: 'camila.rojas.cr@ticosoft.cr',
    puesto: 'Ingeniera de Software',
    deptoCodigo: 'ING',
    lugarIdx: 0,
  },
  {
    codigo_empleado: 'EMP-0252',
    nombre: 'Andres Vindas Quesada',
    apellidos: 'Vindas Quesada',
    email: 'andres.vindas.cr@ticosoft.cr',
    puesto: 'Analista de Operaciones',
    deptoCodigo: 'OPS',
    lugarIdx: 3,
  },
  {
    codigo_empleado: 'EMP-0253',
    nombre: 'Sofia Madrigal Salas',
    apellidos: 'Madrigal Salas',
    email: 'sofia.madrigal.cr@ticosoft.cr',
    puesto: 'Especialista Financiera',
    deptoCodigo: 'FIN',
    lugarIdx: 5,
  },
  {
    codigo_empleado: 'EMP-0254',
    nombre: 'Gabriel Solano Vega',
    apellidos: 'Solano Vega',
    email: 'gabriel.solano.cr@ticosoft.cr',
    puesto: 'Ingeniero de Datos',
    deptoCodigo: 'ING',
    lugarIdx: 7,
  },
  {
    codigo_empleado: 'EMP-0255',
    nombre: 'Valeria Cascante Mora',
    apellidos: 'Cascante Mora',
    email: 'valeria.cascante.cr@ticosoft.cr',
    puesto: 'Ejecutiva Comercial',
    deptoCodigo: 'VEN',
    lugarIdx: 9,
  },
  {
    codigo_empleado: 'EMP-0256',
    nombre: 'Esteban Sibaja Araya',
    apellidos: 'Sibaja Araya',
    email: 'esteban.sibaja.cr@ticosoft.cr',
    puesto: 'Coordinador de Soporte',
    deptoCodigo: 'SAC',
    lugarIdx: 11,
  },
  {
    codigo_empleado: 'EMP-0257',
    nombre: 'Natalia Ugalde Montero',
    apellidos: 'Ugalde Montero',
    email: 'natalia.ugalde.cr@ticosoft.cr',
    puesto: 'Especialista de Talento',
    deptoCodigo: 'RRHH',
    lugarIdx: 13,
  },
  {
    codigo_empleado: 'EMP-0258',
    nombre: 'Pablo Quiros Valverde',
    apellidos: 'Quiros Valverde',
    email: 'pablo.quiros.cr@ticosoft.cr',
    puesto: 'Analista DevOps',
    deptoCodigo: 'ING',
    lugarIdx: 4,
  },
  {
    codigo_empleado: 'EMP-0259',
    nombre: 'Mariana Cerdas Alfaro',
    apellidos: 'Cerdas Alfaro',
    email: 'mariana.cerdas.cr@ticosoft.cr',
    puesto: 'Contadora Senior',
    deptoCodigo: 'FIN',
    lugarIdx: 10,
  },
  {
    codigo_empleado: 'EMP-0260',
    nombre: 'Felipe Brenes Obando',
    apellidos: 'Brenes Obando',
    email: 'felipe.brenes.cr@ticosoft.cr',
    puesto: 'Asesor Comercial B2B',
    deptoCodigo: 'VEN',
    lugarIdx: 14,
  },
];

function extraerApellidos(nombreCompleto = '') {
  const partes = String(nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 3) {
    return partes.slice(-2).join(' ');
  }
  if (partes.length === 2) {
    return partes[1];
  }
  return 'TicoSoft';
}

function construirCedulaUnica(idx, cedulasUsadas) {
  let intento = idx;
  while (true) {
    const prov = (intento % 7) + 1;
    const bloque1 = String(1000 + ((intento * 37) % 8999)).padStart(4, '0');
    const bloque2 = String(1000 + ((intento * 73 + 19) % 8999)).padStart(4, '0');
    const candidata = `${prov}-${bloque1}-${bloque2}`;
    if (!cedulasUsadas.has(candidata)) {
      cedulasUsadas.add(candidata);
      return candidata;
    }
    intento += 1;
  }
}

function construirTelefono(idx) {
  const prefijo = idx % 3 === 0 ? 7 : 8;
  const part1 = String(100 + ((idx * 17) % 899)).padStart(3, '0');
  const part2 = String(1000 + ((idx * 41) % 8999)).padStart(4, '0');
  return `${prefijo}${part1}-${part2}`;
}

function construirFechaNacimiento(idx, fechaIngresoStr) {
  const anioIngreso = Number(String(fechaIngresoStr || '2023-01-01').slice(0, 4)) || 2023;
  const anioNac = Math.min(anioIngreso - 20, 1978 + (idx % 24));
  const mes = String((idx % 12) + 1).padStart(2, '0');
  const dia = String((idx % 27) + 1).padStart(2, '0');
  return `${anioNac}-${mes}-${dia}`;
}

function obtenerUltimosDiasHabiles(cantidad = 30) {
  const dias = [];
  const cursor = new Date();
  while (dias.length < cantidad) {
    const diaSemana = cursor.getUTCDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dias.reverse();
}

function generarHorarioDia(colabIdx, diaIdx) {
  const seed = (colabIdx * 31 + diaIdx * 17) % 100;

  if (seed < 4) {
    return {
      hora_entrada: null,
      hora_salida: null,
      modalidad: colabIdx % 2 === 0 ? 'teletrabajo' : 'presencial',
      estado: 'justificada',
      observacion: 'Ausencia justificada con respaldo RRHH',
    };
  }

  if (seed < 14) {
    // Hora extra (18:00 a 20:00)
    const opcionesSalida = ['18:00', '18:30', '19:00', '19:30', '20:00'];
    const minutosEnt = String(55 + (seed % 5)).padStart(2, '0');
    const horaEnt = seed % 2 === 0 ? `07:${minutosEnt}` : `08:0${seed % 4}`;
    return {
      hora_entrada: horaEnt,
      hora_salida: opcionesSalida[seed % opcionesSalida.length],
      modalidad: colabIdx % 3 === 0 ? 'teletrabajo' : 'presencial',
      estado: 'presente',
      observacion: 'Cierre operativo con horas extra autorizadas',
    };
  }

  if (seed < 24) {
    // Salida temprana (15:30 a 16:40)
    const opcionesTemprana = ['15:30', '15:45', '16:00', '16:15', '16:30', '16:40'];
    return {
      hora_entrada: `07:${String(52 + (seed % 7)).padStart(2, '0')}`,
      hora_salida: opcionesTemprana[seed % opcionesTemprana.length],
      modalidad: colabIdx % 2 === 0 ? 'presencial' : 'teletrabajo',
      estado: 'presente',
      observacion: 'Retiro anticipado registrado',
    };
  }

  if (seed < 38) {
    // Llegada tardía (08:15 a 09:10)
    const opcionesTarde = ['08:15', '08:22', '08:30', '08:45', '08:55', '09:10'];
    return {
      hora_entrada: opcionesTarde[seed % opcionesTarde.length],
      hora_salida: seed % 2 === 0 ? '17:05' : '17:15',
      modalidad: 'presencial',
      estado: 'presente',
      observacion: 'Ingreso posterior a hora base',
    };
  }

  // Jornada puntual estándar
  const entMin = seed % 5;
  const salMin = seed % 15;
  return {
    hora_entrada: seed % 2 === 0 ? `07:${String(55 + entMin).padStart(2, '0')}` : `08:0${entMin}`,
    hora_salida: `17:${String(salMin).padStart(2, '0')}`,
    modalidad: colabIdx % 3 === 0 ? 'teletrabajo' : 'presencial',
    estado: 'presente',
    observacion: 'Jornada ordinaria completa',
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    const passwordHash = bcrypt.hashSync('DemoRRHH2026!', 10);

    // 1. Insertar los 10 nuevos trabajadores CR si no existen (llevando a >= 260)
    const [deptos] = await queryInterface.sequelize.query(
      'SELECT id, codigo FROM departamentos ORDER BY id ASC;'
    );
    const deptoPorCodigo = Object.fromEntries(deptos.map((d) => [d.codigo, d.id]));
    const deptoFallbackId = deptos[0]?.id;

    const [existentesIniciales] = await queryInterface.sequelize.query(
      'SELECT id, codigo_empleado, email, cedula FROM colaboradores ORDER BY id ASC;'
    );
    const codigosExistentes = new Set(existentesIniciales.map((c) => c.codigo_empleado));
    const emailsExistentes = new Set(existentesIniciales.map((c) => c.email));
    const cedulasUsadas = new Set(
      existentesIniciales.map((c) => c.cedula).filter((c) => Boolean(c && String(c).trim()))
    );

    const nuevosAInsertar = [];
    NUEVOS_COLABORADORES_CR.forEach((n, idx) => {
      if (codigosExistentes.has(n.codigo_empleado) || emailsExistentes.has(n.email)) {
        return;
      }
      const lugar = LUGARES_COSTA_RICA[n.lugarIdx % LUGARES_COSTA_RICA.length];
      const fechaIngreso = `202${1 + (idx % 4)}-0${(idx % 8) + 1}-15`;
      nuevosAInsertar.push({
        codigo_empleado: n.codigo_empleado,
        nombre: n.nombre,
        apellidos: n.apellidos,
        email: n.email,
        password: passwordHash,
        departamento_id: deptoPorCodigo[n.deptoCodigo] || deptoFallbackId,
        puesto: n.puesto,
        fecha_ingreso: fechaIngreso,
        salario_base: '1450000.00',
        perfil_acceso: n.deptoCodigo === 'RRHH' ? 'rrhh' : 'colaborador',
        estado: 'activo',
        cedula: construirCedulaUnica(300 + idx, cedulasUsadas),
        telefono: construirTelefono(300 + idx),
        fecha_nacimiento: construirFechaNacimiento(300 + idx, fechaIngreso),
        provincia: lugar.provincia,
        canton: lugar.canton,
        distrito: lugar.distrito,
        direccion_exacta: `${lugar.senas}, casa #${10 + idx}`,
        terminos_aceptados_en: ahora,
        created_at: ahora,
        updated_at: ahora,
      });
    });

    if (nuevosAInsertar.length > 0) {
      await queryInterface.bulkInsert('colaboradores', nuevosAInsertar);
    }

    // 2. Enriquecer todos los colaboradores con campos de Costa Rica faltantes y asegurar saldo 2026
    const [todosColabs] = await queryInterface.sequelize.query(
      'SELECT id, nombre, apellidos, cedula, telefono, fecha_nacimiento, provincia, canton, distrito, direccion_exacta, fecha_ingreso, terminos_aceptados_en FROM colaboradores ORDER BY id ASC;'
    );
    const [saldosExistentes] = await queryInterface.sequelize.query(
      "SELECT colaborador_id FROM saldos_vacaciones WHERE periodo = '2026';"
    );
    const colabsConSaldo = new Set(saldosExistentes.map((s) => s.colaborador_id));
    const saldosNuevos = [];

    for (let idx = 0; idx < todosColabs.length; idx += 1) {
      const c = todosColabs[idx];
      const lugar = LUGARES_COSTA_RICA[idx % LUGARES_COSTA_RICA.length];

      const apellidosVal =
        c.apellidos && String(c.apellidos).trim()
          ? c.apellidos
          : extraerApellidos(c.nombre);
      const cedulaVal =
        c.cedula && String(c.cedula).trim()
          ? c.cedula
          : construirCedulaUnica(idx + 1, cedulasUsadas);
      const telefonoVal =
        c.telefono && String(c.telefono).trim() ? c.telefono : construirTelefono(idx + 1);
      const fechaNacVal = c.fecha_nacimiento || construirFechaNacimiento(idx + 1, c.fecha_ingreso);
      const provinciaVal =
        c.provincia && String(c.provincia).trim() ? c.provincia : lugar.provincia;
      const cantonVal = c.canton && String(c.canton).trim() ? c.canton : lugar.canton;
      const distritoVal =
        c.distrito && String(c.distrito).trim() ? c.distrito : lugar.distrito;
      const direccionVal =
        c.direccion_exacta && String(c.direccion_exacta).trim()
          ? c.direccion_exacta
          : `${lugar.senas}, residencial #${(idx % 50) + 1}`;
      const terminosVal = c.terminos_aceptados_en || ahora;

      await queryInterface.sequelize.query(
        `UPDATE colaboradores
         SET apellidos = :apellidos,
             cedula = :cedula,
             telefono = :telefono,
             fecha_nacimiento = :fecha_nacimiento,
             provincia = :provincia,
             canton = :canton,
             distrito = :distrito,
             direccion_exacta = :direccion_exacta,
             terminos_aceptados_en = :terminos_aceptados_en,
             updated_at = :updated_at
         WHERE id = :id;`,
        {
          replacements: {
            id: c.id,
            apellidos: apellidosVal,
            cedula: cedulaVal,
            telefono: telefonoVal,
            fecha_nacimiento: fechaNacVal,
            provincia: provinciaVal,
            canton: cantonVal,
            distrito: distritoVal,
            direccion_exacta: direccionVal,
            terminos_aceptados_en: terminosVal,
            updated_at: ahora,
          },
        }
      );

      if (!colabsConSaldo.has(c.id)) {
        saldosNuevos.push({
          colaborador_id: c.id,
          periodo: '2026',
          dias_asignados: 12,
          dias_tomados: 0,
          dias_disponibles: 12,
          created_at: ahora,
          updated_at: ahora,
        });
      }
    }

    if (saldosNuevos.length > 0) {
      await queryInterface.bulkInsert('saldos_vacaciones', saldosNuevos);
    }

    // 3. Enriquecer asistencias de los últimos 30 días hábiles sin duplicar (colaborador_id, fecha)
    const diasHabiles = obtenerUltimosDiasHabiles(30);
    const fechaMin = diasHabiles[0];
    const [asistenciasExistentes] = await queryInterface.sequelize.query(
      'SELECT id, colaborador_id, fecha, hora_entrada, hora_salida, estado FROM asistencias WHERE fecha >= :fechaMin;',
      { replacements: { fechaMin } }
    );

    const mapaExistente = new Map();
    for (const a of asistenciasExistentes) {
      mapaExistente.set(`${a.colaborador_id}::${a.fecha}`, a);
    }

    const asistenciasAInsertar = [];

    for (let colabIdx = 0; colabIdx < todosColabs.length; colabIdx += 1) {
      const colab = todosColabs[colabIdx];

      for (let diaIdx = 0; diaIdx < diasHabiles.length; diaIdx += 1) {
        const fecha = diasHabiles[diaIdx];
        const key = `${colab.id}::${fecha}`;
        const marca = generarHorarioDia(colabIdx, diaIdx);
        const existente = mapaExistente.get(key);

        if (existente) {
          if (existente.estado === 'presente' && (!existente.hora_salida || !existente.hora_entrada)) {
            const nuevaEntrada = existente.hora_entrada || marca.hora_entrada || '08:00';
            const nuevaSalida = existente.hora_salida || marca.hora_salida || '17:00';
            await queryInterface.sequelize.query(
              'UPDATE asistencias SET hora_entrada = :hora_entrada, hora_salida = :hora_salida, updated_at = :updated_at WHERE id = :id;',
              {
                replacements: {
                  id: existente.id,
                  hora_entrada: nuevaEntrada,
                  hora_salida: nuevaSalida,
                  updated_at: ahora,
                },
              }
            );
          }
          continue;
        }

        asistenciasAInsertar.push({
          colaborador_id: colab.id,
          fecha,
          hora_entrada: marca.hora_entrada,
          hora_salida: marca.hora_salida,
          modalidad: marca.modalidad,
          estado: marca.estado,
          comprobante_url: null,
          entidad_comprobante: null,
          observacion: marca.observacion,
          created_at: ahora,
          updated_at: ahora,
        });
      }
    }

    const TAMANO_LOTE = 1000;
    for (let i = 0; i < asistenciasAInsertar.length; i += TAMANO_LOTE) {
      await queryInterface.bulkInsert('asistencias', asistenciasAInsertar.slice(i, i + TAMANO_LOTE));
    }

    // 4. Sincronizar secuencias de PostgreSQL
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('departamentos', 'id'), COALESCE((SELECT MAX(id) FROM departamentos), 1), true);"
    );
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('colaboradores', 'id'), COALESCE((SELECT MAX(id) FROM colaboradores), 1), true);"
    );
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('saldos_vacaciones', 'id'), COALESCE((SELECT MAX(id) FROM saldos_vacaciones), 1), true);"
    );
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('asistencias', 'id'), COALESCE((SELECT MAX(id) FROM asistencias), 1), true);"
    );
  },

  async down(queryInterface) {
    const codigosExtra = NUEVOS_COLABORADORES_CR.map((n) => n.codigo_empleado);
    const [extraRows] = await queryInterface.sequelize.query(
      'SELECT id FROM colaboradores WHERE codigo_empleado IN (:codigos);',
      { replacements: { codigos: codigosExtra } }
    );
    const extraIds = extraRows.map((r) => r.id);

    if (extraIds.length > 0) {
      await queryInterface.sequelize.query(
        'DELETE FROM asistencias WHERE colaborador_id IN (:ids);',
        { replacements: { ids: extraIds } }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM saldos_vacaciones WHERE colaborador_id IN (:ids);',
        { replacements: { ids: extraIds } }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM colaboradores WHERE id IN (:ids);',
        { replacements: { ids: extraIds } }
      );
    }
  },
};
