'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require('docx');

const OUTPUT_DIR = path.resolve(__dirname, '../../documentos_drive/nuevas_politicas');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function crearPdf(rutaSalida, lineas) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'LETTER',
      compress: false,
      pdfVersion: '1.4',
    });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => {
      try {
        fs.writeFileSync(rutaSalida, Buffer.concat(buffers));
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    for (const item of lineas) {
      if (item.tipo === 'titulo') {
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#0F172A').text(item.texto, { align: 'left' });
        doc.moveDown(0.5);
      } else if (item.tipo === 'meta') {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(item.texto);
      } else if (item.tipo === 'h2') {
        doc.moveDown(0.7);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1E3A8A').text(item.texto);
        doc.moveDown(0.3);
      } else if (item.tipo === 'p') {
        doc.font('Helvetica').fontSize(10.5).fillColor('#1E293B').text(item.texto, { lineGap: 3 });
        doc.moveDown(0.35);
      } else if (item.tipo === 'li') {
        doc.font('Helvetica').fontSize(10.5).fillColor('#1E293B').text(`- ${item.texto}`, {
          indent: 14,
          lineGap: 2,
        });
        doc.moveDown(0.2);
      } else if (item.tipo === 'sep') {
        doc.moveDown(0.4);
      }
    }

    doc.end();
  });
}

function crearDocxDesdeBloques(rutaSalida, bloques) {
  const children = [];

  for (const b of bloques) {
    if (b.tipo === 'titulo') {
      children.push(
        new Paragraph({
          text: b.texto,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 160 },
        })
      );
    } else if (b.tipo === 'meta') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.texto, bold: true, size: 20 })],
          spacing: { after: 60 },
        })
      );
    } else if (b.tipo === 'h2') {
      children.push(
        new Paragraph({
          text: b.texto,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (b.tipo === 'p') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.texto, size: 22 })],
          spacing: { after: 120 },
        })
      );
    } else if (b.tipo === 'li') {
      children.push(
        new Paragraph({
          text: b.texto,
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else if (b.tipo === 'tabla') {
      const rows = b.filas.map((fila, idx) =>
        new TableRow({
          children: fila.map(
            (celda) =>
              new TableCell({
                width: { size: Math.floor(100 / fila.length), type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: String(celda), bold: idx === 0, size: 20 })],
                  }),
                ],
              })
          ),
        })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
      children.push(new Paragraph({ text: '', spacing: { after: 140 } }));
    }
  }

  const document = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(document).then((buffer) => {
    fs.writeFileSync(rutaSalida, buffer);
  });
}

async function generarDocumentos() {
  ensureDir(OUTPUT_DIR);

  // 06 - Politica de Permisos y Licencias (PDF)
  await crearPdf(path.join(OUTPUT_DIR, '06_Politica_Permisos_y_Licencias_TicoSoft.pdf'), [
    { tipo: 'titulo', texto: 'POLITICA DE PERMISOS Y LICENCIAS LABORALES - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Politica de Permisos y Licencias - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Gerencia de Talento Humano y Legal' },
    { tipo: 'sep' },
    { tipo: 'h2', texto: '1. Objetivo y Alcance' },
    {
      tipo: 'p',
      texto:
        'La presente politica regula el otorgamiento de permisos con goce de salario, licencias especiales establecidas en la legislacion laboral de Costa Rica y permisos sin goce salarial para todas las personas colaboradoras activas de TicoSoft S.A.',
    },
    { tipo: 'h2', texto: '2. Permiso por Fallecimiento de Familiar o Duelo' },
    {
      tipo: 'p',
      texto:
        'En el sector privado de Costa Rica, el Codigo de Trabajo no fija un minimo obligatorio de dias libres por duelo; sin embargo, TicoSoft S.A. otorga este beneficio corporativo superior a la ley con goce integro de salario:',
    },
    {
      tipo: 'li',
      texto:
        'Familiares de primer grado (3 dias habiles con goce de salario): aplica por fallecimiento de conyuge, pareja en union de hecho, padres, hijos o hermanos.',
    },
    {
      tipo: 'li',
      texto:
        'Familiares de segundo grado (1 dia habil con goce de salario): aplica por fallecimiento de abuelos, nietos, suegros o cunados.',
    },
    {
      tipo: 'p',
      texto:
        'Para formalizar el permiso por duelo, la persona colaboradora debe notificar a su jefatura directa y cargar el acta o constancia de defuncion en el apartado Justificar ausencia del portal dentro de las 48 horas siguientes o al reincorporarse.',
    },
    { tipo: 'h2', texto: '3. Licencia de Maternidad y Lactancia' },
    {
      tipo: 'li',
      texto:
        'Licencia de maternidad (Art. 95 del Codigo de Trabajo): dura cuatro (4) meses remunerados, distribuidos ordinariamente en un mes antes del parto y tres meses posteriores al alumbramiento.',
    },
    {
      tipo: 'li',
      texto:
        'Remuneracion: durante los cuatro meses de licencia de maternidad, la CCSS cubre el 50 % del salario como subsidio y TicoSoft S.A. cubre el 50 % restante de forma puntual.',
    },
    {
      tipo: 'li',
      texto:
        'Periodo de lactancia materna (Art. 97 del Codigo de Trabajo): al regresar de la licencia, la madre disfruta de una hora diaria remunerada para lactancia o extraccion en sala acondicionada, previa presentacion de dictamen medico mensual.',
    },
    { tipo: 'h2', texto: '4. Licencia de Paternidad y Casos Especiales (Ley N. 10211)' },
    {
      tipo: 'p',
      texto:
        'En cumplimiento de la Ley N. 10211 que reforma el articulo 95 del Codigo de Trabajo en Costa Rica, TicoSoft S.A. concede licencia de paternidad con goce salarial a los padres trabajadores del sector privado:',
    },
    {
      tipo: 'li',
      texto:
        'Duracion ordinaria de licencia de paternidad: dos (2) dias con goce de salario por semana durante las primeras cuatro (4) semanas contadas a partir del nacimiento de la persona menor, para un total de ocho (8) dias habiles remunerados.',
    },
    {
      tipo: 'li',
      texto:
        'Licencia por adopcion: tres (3) meses para la persona adoptante individual o distribuible de comun acuerdo en adopciones conjuntas, presentando la resolucion del PANI o juzgado de familia.',
    },
    {
      tipo: 'li',
      texto:
        'Requisito documental: aportar el certificado de nacimiento emitido por el Registro Civil o constancia medica oficial del centro de salud.',
    },
    { tipo: 'h2', texto: '5. Permisos por Matrimonio y Estudios Universitarios' },
    {
      tipo: 'li',
      texto:
        'Matrimonio civil o religioso: TicoSoft S.A. otorga tres (3) dias habiles consecutivos con goce de salario, solicitados con al menos 15 dias de anticipacion y adjuntando copia del acta de matrimonio posterior al evento.',
    },
    {
      tipo: 'li',
      texto:
        'Estudio y examenes academicos: se concede medio dia con goce de salario por cada examen universitario presencial o sincronico, previa presentacion del comprobante oficial de matricula o certificacion de asistencia de la universidad.',
    },
    { tipo: 'h2', texto: '6. Permisos sin Goce de Salario' },
    {
      tipo: 'p',
      texto:
        'Por motivos personales calificados y una vez agotado el saldo de vacaciones cuando corresponda, el colaborador puede solicitar un permiso sin goce de salario de hasta treinta (30) dias calendario. Requiere aprobacion escrita de la jefatura inmediata y de Recursos Humanos (ana.solis@ticosoft.cr) con al menos 5 dias habiles de antelacion.',
    },
  ]);

  // 07 - Guia de Justificacion de Ausencias Laborales en Costa Rica (PDF)
  await crearPdf(path.join(OUTPUT_DIR, '07_Guia_Justificacion_Ausencias_Laborales_CR_TicoSoft.pdf'), [
    { tipo: 'titulo', texto: 'GUIA DE JUSTIFICACION DE AUSENCIAS LABORALES EN COSTA RICA - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Guia de Justificacion de Ausencias Laborales en Costa Rica - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Talento Humano y Cumplimiento Laboral' },
    { tipo: 'sep' },
    { tipo: 'h2', texto: '1. Plazo Legal de 48 Horas y Marco del Codigo de Trabajo' },
    {
      tipo: 'p',
      texto:
        'De conformidad con el articulo 81 inciso g del Codigo de Trabajo de Costa Rica, la ausencia injustificada durante dos dias consecutivos o mas de dos dias alternos dentro de un mismo mes calendario faculta al patrono para dar por terminado el contrato sin responsabilidad patronal. Por ello, todo colaborador debe avisar de inmediato a su jefatura y presentar su justificacion formal en un plazo maximo de 48 horas habiles.',
    },
    { tipo: 'h2', texto: '2. Tipos de Justificaciones Laborales Validas en Costa Rica' },
    {
      tipo: 'p',
      texto:
        'En Costa Rica y dentro de TicoSoft S.A. se reconocen siete tipos validos de justificacion de ausencia laboral, cada uno respaldado por un comprobante especifico:',
    },
    {
      tipo: 'li',
      texto:
        '1) Incapacidad por enfermedad comun (CCSS): requiere la boleta oficial Aviso al Patrono emitida por la Caja Costarricense de Seguro Social. Nota legal obligatoria: los dictamenes de medicos privados no constituyen incapacidad legal por si mismos y deben ser refrendados por la CCSS dentro de las 48 horas siguientes para generar subsidio y validez legal.',
    },
    {
      tipo: 'li',
      texto:
        '2) Incapacidad por riesgo o accidente laboral (INS): requiere la boleta oficial de incapacidad emitida por el Instituto Nacional de Seguros derivada de un accidente en el trabajo o en trayecto.',
    },
    {
      tipo: 'li',
      texto:
        '3) Cita medica o atencion en emergencias: requiere constancia de asistencia emitida por la CCSS, hospital o clinica medica autorizada donde conste la hora de entrada y la hora de salida del paciente.',
    },
    {
      tipo: 'li',
      texto:
        '4) Fallecimiento de familiar o duelo: requiere acta o constancia oficial de defuncion del familiar para validar los 3 dias habiles por primer grado o 1 dia habil por segundo grado.',
    },
    {
      tipo: 'li',
      texto:
        '5) Citacion judicial o deber civico obligatorio: requiere cedula de citacion formal emitida por el Poder Judicial, juzgado competente o Tribunal Supremo de Elecciones (TSE).',
    },
    {
      tipo: 'li',
      texto:
        '6) Licencias legales de maternidad, paternidad o adopcion: requiere certificacion medica de embarazo emitida por la CCSS, certificado oficial de nacimiento del Registro Civil o resolucion administrativa/judicial de adopcion.',
    },
    {
      tipo: 'li',
      texto:
        '7) Fuerza mayor o calamidad domestica: aplica ante eventos imprevistos graves (inundaciones, incendios, cierres totales de ruta por desastre, accidentes de transito) respaldados por comprobante del Cuerpo de Bomberos, Policia de Transito, Cruz Roja o autoridad publica verificable.',
    },
    { tipo: 'h2', texto: '3. Como Enviar una Justificacion en el Portal de TicoSoft S.A.' },
    {
      tipo: 'p',
      texto:
        'Para registrar cualquier ausencia ya ocurrida o en curso, el colaborador debe ingresar al apartado Justificar ausencia en su portal personal, seleccionar el tipo de justificacion aplicable en Costa Rica, indicar las fechas Desde y Hasta (incluyendo fechas recientes de hasta 48 horas atras), adjuntar el comprobante en formato PDF, JPG o PNG (maximo 5 MB) y enviarlo a revision. Recursos Humanos revisara el respaldo y actualizara el estado a Aprobado o Rechazado.',
    },
  ]);

  // 08 - Reglamento de Jornada, Teletrabajo y Asistencia (DOCX)
  await crearDocxDesdeBloques(path.join(OUTPUT_DIR, '08_Reglamento_Jornada_Teletrabajo_y_Asistencia_TicoSoft.docx'), [
    { tipo: 'titulo', texto: 'REGLAMENTO DE JORNADA, TELETRABAJO Y ASISTENCIA - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Reglamento de Jornada, Teletrabajo y Asistencia - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Operaciones y Talento Humano' },
    { tipo: 'h2', texto: '1. Jornadas Laborales Ordinarias (Codigo de Trabajo de Costa Rica)' },
    {
      tipo: 'p',
      texto:
        'En TicoSoft S.A. los limites ordinarios de jornada laboral se rigen por los articulos 135 y siguientes del Codigo de Trabajo:',
    },
    {
      tipo: 'tabla',
      filas: [
        ['Tipo de Jornada', 'Horario de Referencia', 'Limite Diario', 'Limite Semanal'],
        ['Jornada Diurna', 'Entre 05:00 y 19:00 horas', '8 horas por dia', '48 horas por semana'],
        ['Jornada Mixta', 'Comprende horas diurnas y nocturnas (max. 3.5 nocturnas)', '7 horas por dia', '42 horas por semana'],
        ['Jornada Nocturna', 'Entre 19:00 y 05:00 horas', '6 horas por dia', '36 horas por semana'],
      ],
    },
    { tipo: 'h2', texto: '2. Horas Extraordinarias y Control de Marcas' },
    {
      tipo: 'li',
      texto:
        'Pago de horas extra (Art. 139 del Codigo de Trabajo): toda hora laborada fuera de la jornada ordinaria con autorizacion previa de la jefatura se remunera con un recargo adicional del +50 % sobre el valor de la hora ordinaria (tiempo y medio). En dias feriados de pago obligatorio laborados se paga tarifa doble.',
    },
    {
      tipo: 'li',
      texto:
        'Control de marcas diarias: todo colaborador debe registrar su marca de entrada y su marca de salida cada dia desde su portal personal o control de asistencia corporativo, verificando su puntualidad.',
    },
    { tipo: 'h2', texto: '3. Modalidad de Teletrabajo Hibrido (Ley N. 9738)' },
    {
      tipo: 'p',
      texto:
        'Al amparo de la Ley N. 9738 para Regular el Teletrabajo en Costa Rica, TicoSoft S.A. implementa un modelo hibrido flexible de hasta tres (3) dias de teletrabajo por semana, sujeto a adenda contractual de teletrabajo y cumplimiento de metas:',
    },
    {
      tipo: 'li',
      texto:
        'Los dias presenciales obligatorios de coordinacion de equipo se acuerdan por departamento (minimo 2 dias presenciales semanales en sede central de San Jose o Heredia).',
    },
    {
      tipo: 'li',
      texto:
        'El colaborador teletrabajador mantiene el derecho a la desconexion digital fuera de su horario ordinario y conserva cobertura de riesgos del trabajo del INS en el espacio declarado en su adenda.',
    },
  ]);

  // 09 - Catalogo de Beneficios Corporativos (DOCX)
  await crearDocxDesdeBloques(path.join(OUTPUT_DIR, '09_Catalogo_Beneficios_TicoSoft.docx'), [
    { tipo: 'titulo', texto: 'CATALOGO DE BENEFICIOS CORPORATIVOS - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Catalogo de Beneficios Corporativos - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Compensacion y Bienestar' },
    { tipo: 'h2', texto: '1. Seguro Medico Privado Colectivo' },
    {
      tipo: 'p',
      texto:
        'A partir de la superacion del periodo de prueba de tres (3) meses, TicoSoft S.A. incluye a cada colaborador activo en su poliza colectiva de seguro medico privado con cobertura de consultas medicas generales y especializadas, examenes de laboratorio, atencion odontologica preventiva anual y cobertura hospitalaria, con opcion de incluir dependientes directos mediante tarifa preferencial.',
    },
    { tipo: 'h2', texto: '2. Asociacion Solidarista (ASOTICOSOFT)' },
    {
      tipo: 'li',
      texto:
        'Aporte patronal del 5.33 %: TicoSoft S.A. transfiere mensualmente el 5.33 % sobre el salario bruto de los asociados a la Asociacion Solidarista en calidad de adelanto y custodia del auxilio de cesantia.',
    },
    {
      tipo: 'li',
      texto:
        'Ahorro personal del colaborador: la persona afiliada ahorra voluntariamente entre un 3 % y un 5 % mensual de su salario, obteniendo acceso a excedentes anuales, prestamos personales de tasa preferencial y convenios comerciales.',
    },
    { tipo: 'h2', texto: '3. Presupuesto Anual de Capacitacion y Certificaciones' },
    {
      tipo: 'p',
      texto:
        'TicoSoft S.A. asigna un presupuesto anual individual por colaborador equivalente a hasta USD 600 anuales para cursos tecnicos, certificaciones oficiales en ingenieria, liderazgo o idiomas y conferencias vinculadas a su plan de desarrollo profesional.',
    },
  ]);

  // 10 - Politica de Evaluacion del Desempeno y Carrera (DOCX)
  await crearDocxDesdeBloques(path.join(OUTPUT_DIR, '10_Politica_Evaluacion_Desempeno_y_Carrera_TicoSoft.docx'), [
    { tipo: 'titulo', texto: 'POLITICA DE EVALUACION DEL DESEMPENO Y PLAN DE CARRERA - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Politica de Evaluacion del Desempeno y Plan de Carrera - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Desarrollo Organizacional y RRHH' },
    { tipo: 'h2', texto: '1. Ciclos Semestrales de Evaluacion (Junio y Diciembre)' },
    {
      tipo: 'p',
      texto:
        'TicoSoft S.A. ejecuta dos ciclos formales de evaluacion del desempeno cada ano calendario, durante las dos primeras semanas de junio y de diciembre. Cada ciclo contempla autoevaluacion del colaborador, evaluacion de jefatura directa y retroalimentacion estructurada basada en objetivos y competencias.',
    },
    { tipo: 'h2', texto: '2. Promociones, Ascensos y Revisiones Salariales' },
    {
      tipo: 'li',
      texto:
        'Las personas colaboradoras que alcancen calificacion igual o superior a 4.2 sobre 5.0 en dos ciclos consecutivos son elegibles prioritarias para revision salarial por merito o promocion interna a niveles superiores.',
    },
    {
      tipo: 'li',
      texto:
        'Todas las vacantes de crecimiento profesional se publican primero de manera interna durante 10 dias habiles antes de abrir concurso externo.',
    },
    { tipo: 'h2', texto: '3. Planes de Mejora de Desempeno (PIP)' },
    {
      tipo: 'p',
      texto:
        'Cuando el resultado semestral sea inferior a 2.8 sobre 5.0, Recursos Humanos y la jefatura definiran conjuntamente un Plan de Mejora de Desempeno de sesenta (60) a noventa (90) dias calendario con metas medibles y seguimiento quincenal de acompanamiento.',
    },
  ]);

  // 11 - Codigo de Conducta y Protocolo contra el Acoso (PDF)
  await crearPdf(path.join(OUTPUT_DIR, '11_Codigo_Conducta_y_Protocolo_Acoso_TicoSoft.pdf'), [
    { tipo: 'titulo', texto: 'CODIGO DE CONDUCTA Y PROTOCOLO CONTRA EL ACOSO - TICOSOFT S.A.' },
    { tipo: 'meta', texto: 'Titulo: Codigo de Conducta y Protocolo contra el Acoso - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Comite de Etica y Talento Humano' },
    { tipo: 'sep' },
    { tipo: 'h2', texto: '1. Codigo de Etica e Integridad Profesional' },
    {
      tipo: 'p',
      texto:
        'Toda persona colaboradora de TicoSoft S.A., independientemente de su jerarquia o modalidad de trabajo, debe actuar bajo principios de respeto mutuo, probidad, confidencialidad de la informacion, ausencia de conflictos de interes y cero tolerancia a la discriminacion.',
    },
    { tipo: 'h2', texto: '2. Regimen Disciplinario Progresivo' },
    {
      tipo: 'li',
      texto:
        'Faltas leves: se atienden mediante amonestacion verbal documentada o amonestacion escrita con copia al expediente.',
    },
    {
      tipo: 'li',
      texto:
        'Faltas graves o reincidencia: acarrean suspension sin goce de salario de hasta 8 dias o despido justificado sin responsabilidad patronal conforme al articulo 81 del Codigo de Trabajo.',
    },
    { tipo: 'h2', texto: '3. Protocolo Confidencial contra el Acoso Sexual (Ley N. 7476) y Acoso Laboral' },
    {
      tipo: 'p',
      texto:
        'TicoSoft S.A. mantiene una politica de cero tolerancia ante cualquier manifestacion de hostigamiento sexual en los terminos de la Ley N. 7476 contra el Hostigamiento o Acoso Sexual en el Empleo y la Docencia, asi como frente a conductas de acoso laboral o mobbing.',
    },
    {
      tipo: 'li',
      texto:
        'Canal confidencial de denuncia: cualquier persona afectada o testigo puede presentar denuncia confidencial ante la Comision Investigadora y Direccion de Recursos Humanos (ana.solis@ticosoft.cr) de manera presencial o digital.',
    },
    {
      tipo: 'li',
      texto:
        'Medidas cautelares y garantias: recibida la denuncia, la empresa dicta de inmediato medidas de proteccion y no represalia (reubicacion temporal, teletrabajo protector o separacion de lineas de reporte) garantizando el debido proceso y confidencialidad absoluta durante toda la investigacion (plazo maximo de resolucion de 3 meses segun normativa vigente).',
    },
  ]);

  console.log('6 documentos nuevos generados correctamente en:', OUTPUT_DIR);
}

generarDocumentos().catch((err) => {
  console.error('Error generando documentos:', err);
  process.exit(1);
});
