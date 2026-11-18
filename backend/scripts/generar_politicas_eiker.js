'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
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

const OUTPUT_DIR = path.resolve(__dirname, '../../documentos_drive/eiker');

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
      const rows = b.filas.map(
        (fila, idx) =>
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
      children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc).then((buf) => fs.writeFileSync(rutaSalida, buf));
}

async function generarPolitica01Vacaciones() {
  const md = `Titulo: Politica de Vacaciones y Feriados de Ley - TicoSoft S.A.
Version: v2.1
Fecha de vigencia: 2026-01-01
Responsable: Gerencia de Talento Humano (Ana Solis Vargas)

# Politica de Vacaciones y Feriados de Ley - TicoSoft S.A.

## 1. Derecho y Dias de Vacaciones
De conformidad con el Articulo 153 del Codigo de Trabajo de Costa Rica, todo trabajador tiene derecho a un minimo legal de dos (2) semanas de vacaciones remuneradas por cada cincuenta (50) semanas de labores continuas al servicio de un mismo patrono. En caso de terminacion del contrato antes de cumplir las 50 semanas, corresponde el pago proporcional de un dia por cada mes trabajado (Art. 153 parrafo segundo).

Como beneficio superior al minimo legal, TicoSoft S.A. otorga a todos sus 250 colaboradores quince (15) dias habiles de vacaciones remuneradas por cada ano continuo laborado (equivalente a 1.25 dias habiles acumulados por cada mes calendario trabajado). Este beneficio contractual supera el piso de la legislacion costarricense y aplica por igual para modalidad presencial y teletrabajo.

## 2. Acumulacion y Fraccionamiento
Conforme al Articulo 158 del Codigo de Trabajo, las vacaciones deben disfrutarse sin interrupciones; excepcionalmente pueden dividirse como maximo en dos fracciones segun acuerdo entre las partes, o en la forma mas beneficiosa solicitada formalmente por el colaborador sin reducir los periodos minimos de descanso efectivo.

De acuerdo con el Articulo 159 del Codigo de Trabajo, queda prohibido acumular las vacaciones, salvo por una sola vez cuando el colaborador desempena labores tecnicas, de direccion o confianza que dificulten su reemplazo. En TicoSoft S.A. se permite acumular como maximo un (1) periodo adicional con autorizacion escrita previa de la jefatura directa y de Recursos Humanos. Cuando un colaborador supera los veinte (20) dias habiles disponibles acumulados, el sistema de RRHH genera una alerta preventiva de riesgo de pasivo laboral para programar su disfrute obligatorio.

## 3. Procedimiento y Anticipacion de Solicitud
- Todo colaborador debe registrar su solicitud en el Portal de RRHH con una anticipacion minima de cinco (5) dias habiles respecto a la fecha de inicio deseada.
- Las solicitudes son revisadas por la jefatura inmediata y validadas por Recursos Humanos en un plazo maximo de tres (3) dias habiles.
- Durante el disfrute de vacaciones, el colaborador recibe el 100% de su salario ordinario segun el promedio de las ultimas 50 semanas o el salario vigente si es mas favorable (Art. 157 del Codigo de Trabajo).
- Queda prohibido compensar en dinero las vacaciones vigentes mientras dure la relacion laboral, salvo los casos excepcionales taxativos del Articulo 156 del Codigo de Trabajo o al liquidar la relacion laboral.

## 4. Calendario de Feriados de Ley en Costa Rica 2026
Conforme al Articulo 148 del Codigo de Trabajo de Costa Rica, se reconocen los siguientes dias feriados para el ano 2026 en TicoSoft S.A.:

Feriados de pago obligatorio:
- 1 de enero (jueves): Ano Nuevo.
- 2 de abril (jueves): Jueves Santo.
- 3 de abril (viernes): Viernes Santo.
- 11 de abril (sabado): Dia de Juan Santamaria.
- 1 de mayo (viernes): Dia Internacional del Trabajo.
- 25 de julio (sabado): Anexion del Partido de Nicoya a Costa Rica.
- 15 de agosto (sabado): Dia de la Madre.
- 15 de septiembre (martes): Dia de la Independencia de Costa Rica.
- 1 de diciembre (martes): Dia de la Abolicion del Ejercito.
- 25 de diciembre (viernes): Navidad.

Feriados de pago no obligatorio:
- 2 de agosto (domingo): Dia de la Virgen de los Angeles.
- 31 de agosto (lunes): Dia de la Persona Negra y la Cultura Afrocostarricense.

Regla salarial en TicoSoft S.A.: Dado que la modalidad de pago de TicoSoft S.A. es quincenal/mensual en actividad comercial y tecnologica (Art. 148 y Art. 152 del Codigo de Trabajo), todos los feriados anteriores se disfrutan con goce integro de salario dentro del sueldo quincenal. Si por necesidad operativa critica un colaborador labora un feriado de pago obligatorio o no obligatorio cubierto por pago mensual, recibira un salario adicional sencillo para completar el pago doble exigido por el Ministerio de Trabajo y Seguridad Social (MTSS).
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '01_Politica_Vacaciones_y_Feriados_TicoSoft.md'), md, 'utf8');

  const bloques = [
    { tipo: 'meta', texto: 'Titulo: Politica de Vacaciones y Feriados de Ley - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v2.1' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Gerencia de Talento Humano (Ana Solis Vargas)' },
    { tipo: 'titulo', texto: 'Politica de Vacaciones y Feriados de Ley - TicoSoft S.A.' },
    { tipo: 'h2', texto: '## 1. Derecho y Dias de Vacaciones' },
    {
      tipo: 'p',
      texto:
        'De conformidad con el Articulo 153 del Codigo de Trabajo de Costa Rica, todo trabajador tiene derecho a un minimo legal de dos (2) semanas de vacaciones remuneradas por cada cincuenta (50) semanas de labores continuas al servicio de un mismo patrono.',
    },
    {
      tipo: 'p',
      texto:
        'Como mejora sobre el minimo legal, TicoSoft S.A. otorga quince (15) dias habiles anuales de vacaciones remuneradas (1.25 dias habiles por mes laborado) para todos sus 250 colaboradores.',
    },
    { tipo: 'h2', texto: '## 2. Acumulacion y Fraccionamiento' },
    {
      tipo: 'p',
      texto:
        'Conforme a los Articulos 158 y 159 del Codigo de Trabajo, las vacaciones deben disfrutarse de forma continua o fraccionarse en un maximo de dos periodos por acuerdo de partes. TicoSoft S.A. autoriza acumular como maximo un (1) periodo adicional previa aprobacion de la jefatura y RRHH. Cuando un colaborador supera 20 dias habiles disponibles, se activa la alerta de pasivo laboral para programar su descanso.',
    },
    { tipo: 'h2', texto: '## 3. Procedimiento y Anticipacion de Solicitud' },
    { tipo: 'li', texto: 'La solicitud debe ingresarse en el portal interno con al menos cinco (5) dias habiles de anticipacion.' },
    { tipo: 'li', texto: 'La jefatura y RRHH resuelven en un plazo maximo de tres (3) dias habiles.' },
    { tipo: 'li', texto: 'Durante el periodo de vacaciones se percibe el 100% del salario ordinario (Art. 157 Codigo de Trabajo).' },
    { tipo: 'li', texto: 'Se prohibe compensar en dinero las vacaciones vigentes salvo excepciones legales del Articulo 156.' },
    { tipo: 'h2', texto: '## 4. Calendario de Feriados de Ley en Costa Rica 2026' },
    {
      tipo: 'tabla',
      filas: [
        ['Fecha 2026', 'Conmemoracion', 'Tipo segun Art. 148 CT'],
        ['1 de enero', 'Ano Nuevo', 'Pago obligatorio'],
        ['2 de abril', 'Jueves Santo', 'Pago obligatorio'],
        ['3 de abril', 'Viernes Santo', 'Pago obligatorio'],
        ['11 de abril', 'Dia de Juan Santamaria', 'Pago obligatorio'],
        ['1 de mayo', 'Dia Internacional del Trabajo', 'Pago obligatorio'],
        ['25 de julio', 'Anexion del Partido de Nicoya', 'Pago obligatorio'],
        ['2 de agosto', 'Dia de la Virgen de los Angeles', 'Pago no obligatorio'],
        ['15 de agosto', 'Dia de la Madre', 'Pago obligatorio'],
        ['31 de agosto', 'Dia de la Persona Negra y Cultura Afrocostarricense', 'Pago no obligatorio'],
        ['15 de septiembre', 'Dia de la Independencia', 'Pago obligatorio'],
        ['1 de diciembre', 'Dia de la Abolicion del Ejercito', 'Pago obligatorio'],
        ['25 de diciembre', 'Navidad', 'Pago obligatorio'],
      ],
    },
    {
      tipo: 'p',
      texto:
        'Nota salarial: En empresas con pago quincenal/mensual como TicoSoft S.A., todos los feriados se remuneran dentro del salario ordinario y, en caso de laborarse, se paga un adicional sencillo para completar pago doble (Art. 148 y 152 Codigo de Trabajo).',
    },
  ];

  await crearDocxDesdeBloques(
    path.join(OUTPUT_DIR, '01_Politica_Vacaciones_y_Feriados_TicoSoft.docx'),
    bloques
  );
}

async function generarPolitica02Incapacidades() {
  const lineas = [
    { tipo: 'meta', texto: 'Titulo: Procedimiento de Incapacidades y Subsidios - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v2.0' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Salud Ocupacional y RRHH (Roberto Acuna Solano)' },
    { tipo: 'sep' },
    { tipo: 'titulo', texto: 'Procedimiento de Incapacidades y Subsidios - TicoSoft S.A.' },
    { tipo: 'h2', texto: '## 1. Incapacidad por Enfermedad Comun (CCSS)' },
    {
      tipo: 'p',
      texto:
        'Las incapacidades por enfermedad comun son emitidas exclusivamente por medicos autorizados de la Caja Costarricense de Seguro Social (CCSS) o medicos de empresa/clinicas privadas debidamente refrendadas por la CCSS conforme al Reglamento del Seguro de Salud.',
    },
    {
      tipo: 'p',
      texto:
        'Durante el periodo de incapacidad por enfermedad comun se suspende temporalmente la prestacion de labores sin afectacion de la antiguedad laboral (Art. 79 del Codigo de Trabajo de Costa Rica). Ningun colaborador incapacitado puede realizar teletrabajo ni gestiones operativas mientras la boleta este activa.',
    },
    { tipo: 'h2', texto: '## 2. Riesgo y Accidente Laboral (INS)' },
    {
      tipo: 'p',
      texto:
        'Todo accidente ocurrido durante la jornada laboral, en teletrabajo autorizado o en el trayecto directo entre el domicilio y el centro de trabajo (in itinere) esta cubierto obligatoriamente por la Poliza de Riesgos del Trabajo del Instituto Nacional de Seguros (INS), conforme al Titulo IV (Articulos 193 y siguientes) del Codigo de Trabajo.',
    },
    {
      tipo: 'li',
      texto: 'El colaborador o su jefatura debe notificar el incidente a Salud Ocupacional y RRHH de inmediato para emitir la Orden de Atencion Medica del INS.',
    },
    {
      tipo: 'li',
      texto: 'El INS cubre atencion medica integral, rehabilitacion y el subsidio salarial desde el dia 1 de incapacidad (60% del salario diario promedio durante los primeros 45 dias y porcentaje superior segun la escala del INS a partir del dia 46).',
    },
    { tipo: 'h2', texto: '## 3. Esquema de Pago por Tramo de Dias' },
    {
      tipo: 'li',
      texto: 'Enfermedad comun CCSS - Dias 1 al 3: Segun normativa de la CCSS, el patrono reconoce como minimo el 50% del salario. Como mejora interna, TicoSoft S.A. complementa el subsidio hasta alcanzar el 80% del salario ordinario durante los primeros 3 dias.',
    },
    {
      tipo: 'li',
      texto: 'Enfermedad comun CCSS - A partir del dia 4: La CCSS asume el pago directo del subsidio correspondiente al 60% del salario promedio cotizado en los ultimos 3 meses. TicoSoft S.A. coordina la conciliacion en planilla para evitar deducciones duplicadas.',
    },
    {
      tipo: 'li',
      texto: 'Licencia de maternidad (Art. 95 Codigo de Trabajo): Cuatro (4) meses completos (1 mes preparto y 3 meses posparto) cubiertos con 100% del salario (50% patrono y 50% CCSS).',
    },
    { tipo: 'h2', texto: '## 4. Plazo de Entrega de Boleta y Comprobante' },
    {
      tipo: 'p',
      texto:
        'El colaborador debe reportar su ausencia a su jefatura directa el mismo dia de inicio y cargar la boleta digital oficial (EDUS/CCSS o INS) en el modulo de Asistencias e Incapacidades del portal de RRHH dentro de un plazo maximo de cuarenta y ocho (48) horas habiles tras su emision.',
    },
    {
      tipo: 'p',
      texto:
        'Los comprobantes emitidos por clinicas privadas sin refrendo de la CCSS justifican la ausencia administrativa por hasta 2 dias segun criterio medico, pero no habilitan subsidio de la CCSS hasta contar con el refrendo oficial.',
    },
  ];

  await crearPdf(path.join(OUTPUT_DIR, '02_Procedimiento_Incapacidades_TicoSoft.pdf'), lineas);
}

function generarPolitica03SalarialExcel() {
  const wb = XLSX.utils.book_new();

  const hoja1Datos = [
    ['Titulo', 'Politica Salarial, Deducciones y Aguinaldo - TicoSoft S.A.'],
    ['Version', 'v2.0'],
    ['Fecha de vigencia', '2026-01-01'],
    ['Responsable', 'Especialista de Nomina y Beneficios (Carlos Mora Quesada)'],
    [],
    ['## 1. Esquema y Fechas de Pago Quincenal', '', ''],
    ['Concepto', 'Politica TicoSoft S.A.', 'Base Legal Costa Rica'],
    ['Frecuencia de pago', 'Quincenal: dias 15 y ultimo dia habil de cada mes', 'Art. 164 y 168 Codigo de Trabajo'],
    ['Moneda de pago', 'Colones costarricenses (CRC)', 'Art. 165 Codigo de Trabajo'],
    ['Hora extra diurna / nocturna', '50% adicional (1.5x) sobre hora ordinaria', 'Art. 139 Codigo de Trabajo'],
    ['Trabajo en feriado / descanso', 'Pago doble segun modalidad mensual/quincenal', 'Art. 148 y 152 Codigo de Trabajo'],
    [],
    ['## 2. Deducciones Legales Obligatorias (Cargas Obreras e Impuestos)', '', ''],
    ['Rubro de deduccion', 'Porcentaje / Regla', 'Entidad / Fundamento'],
    ['CCSS - Seguro de Enfermedad y Maternidad (SEM)', '5.50% sobre salario bruto', 'CCSS - Reglamento del Seguro de Salud'],
    ['CCSS - Invalidez, Vejez y Muerte (IVM)', '4.17% sobre salario bruto', 'CCSS - Reglamento IVM'],
    ['Banco Popular - Aporte Obrero (LPT)', '1.00% sobre salario bruto', 'Ley de Proteccion al Trabajador N. 7983'],
    ['Total cargas sociales obreras base', '10.67% sobre salario bruto', 'Retencion automatica en planilla'],
    ['Impuesto sobre la Renta al Salario', 'Escala progresiva por tramos (0%, 10%, 15%, 20%, 25%) sobre el excedente exento', 'Art. 33 Ley del Impuesto sobre la Renta N. 7092 (Ministerio de Hacienda)'],
    [],
    ['## 3. Calculo y Pago del Aguinaldo (Ley N. 2412)', '', ''],
    ['Regla de calculo', 'Suma total de salarios ordinarios y extraordinarios (horas extra, comisiones y bonos salariales) percibidos del 1 de diciembre del ano anterior al 30 de noviembre del ano en curso, dividida entre doce (12).', 'Ley N. 2412 de Aguinaldo en la Empresa Privada'],
    ['Fecha limite de pago legal', 'Antes del 20 de diciembre de cada ano (en TicoSoft S.A. se deposita el 15 de diciembre)', 'Art. 1 y 2 Ley N. 2412'],
    ['Exenciones del aguinaldo', 'Libre de cargas sociales de la CCSS, Banco Popular e Impuesto sobre la Renta', 'Art. 4 Ley N. 2412 y Ley N. 7092'],
    ['Confidencialidad salarial', 'Los salarios individuales son confidenciales y no se divulgan a terceros', 'Ley N. 8968 de Proteccion de Datos'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(hoja1Datos);
  ws1['!cols'] = [{ wch: 42 }, { wch: 68 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Politica_Salarial');

  const meses = [
    ['Enero', '2026-01-15', '2026-01-30', 'Pago quincenal ordinario'],
    ['Febrero', '2026-02-13', '2026-02-27', 'Pago quincenal ordinario'],
    ['Marzo', '2026-03-13', '2026-03-31', 'Pago quincenal ordinario'],
    ['Abril', '2026-04-15', '2026-04-30', 'Ajuste por feriados de Semana Santa'],
    ['Mayo', '2026-05-15', '2026-05-29', 'Pago quincenal ordinario'],
    ['Junio', '2026-06-15', '2026-06-30', 'Pago quincenal ordinario'],
    ['Julio', '2026-07-15', '2026-07-31', 'Pago quincenal ordinario'],
    ['Agosto', '2026-08-14', '2026-08-31', 'Pago quincenal ordinario'],
    ['Septiembre', '2026-09-14', '2026-09-30', 'Ajuste previo al 15 de septiembre'],
    ['Octubre', '2026-10-15', '2026-10-30', 'Pago quincenal ordinario'],
    ['Noviembre', '2026-11-13', '2026-11-30', 'Cierre de periodo base para aguinaldo (30 nov)'],
    ['Diciembre', '2026-12-15', '2026-12-30', 'Pago de Aguinaldo 2026 el 15 de diciembre + salario ordinario'],
  ];

  const hoja2Datos = [
    ['Titulo', 'Calendario Oficial de Pagos 2026 - TicoSoft S.A.'],
    ['Version', 'v2.0'],
    ['Fecha de vigencia', '2026-01-01'],
    ['Responsable', 'Especialista de Nomina y Beneficios (Carlos Mora Quesada)'],
    [],
    ['## 4. Calendario de Pagos Quincenales y Aguinaldo 2026', '', '', ''],
    ['Mes', 'Primera Quincena (Dia 15 o habil previo)', 'Segunda Quincena (Ultimo dia habil)', 'Observaciones'],
    ...meses,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(hoja2Datos);
  ws2['!cols'] = [{ wch: 16 }, { wch: 36 }, { wch: 36 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Calendario_Pagos_2026');

  XLSX.writeFile(wb, path.join(OUTPUT_DIR, '03_Politica_Salarial_y_Aguinaldo_TicoSoft.xlsx'));
}

async function generarPolitica04OnboardingSalida() {
  const lineas = [
    { tipo: 'meta', texto: 'Titulo: Manual de Onboarding, Preaviso y Liquidacion - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.4' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Gerencia de Talento Humano (Ana Solis Vargas)' },
    { tipo: 'sep' },
    { tipo: 'titulo', texto: 'Manual de Onboarding, Preaviso y Liquidacion - TicoSoft S.A.' },
    { tipo: 'h2', texto: '## 1. Proceso de Onboarding' },
    {
      tipo: 'p',
      texto:
        'Todo nuevo colaborador que ingresa a TicoSoft S.A. recibe un plan estructurado de induccion de treinta (30) dias compuesto por tres etapas: Dia 1 (firma de contrato escrito conforme Art. 22-24 CT, entrega de equipo, accesos y politicas internas), Semana 1 (induccion tecnica con jefatura y mentor asignado) y Dia 30 (evaluacion inicial de adaptacion).',
    },
    { tipo: 'h2', texto: '## 2. Periodo de Prueba (3 Meses)' },
    {
      tipo: 'p',
      texto:
        'De acuerdo con el Codigo de Trabajo y la jurisprudencia laboral de Costa Rica, los contratos por tiempo indefinido cuentan con un periodo de prueba maximo de tres (3) meses calendario. Durante este lapso cualquiera de las partes puede dar por terminada la relacion laboral sin obligacion de pagar preaviso ni auxilio de cesantia, debiendo liquidarse unicamente los dias laborados, vacaciones proporcionales y aguinaldo proporcional.',
    },
    { tipo: 'h2', texto: '## 3. Preaviso por Renuncia o Despido (Art. 28)' },
    {
      tipo: 'p',
      texto:
        'Transcurrido el periodo de prueba de 3 meses, tanto el colaborador que renuncia como el patrono que despide sin justa causa deben otorgar un preaviso conforme a la tabla exacta del Articulo 28 del Codigo de Trabajo de Costa Rica:',
    },
    { tipo: 'li', texto: 'Menos de 3 meses de servicio continuo: 0 dias de preaviso.' },
    { tipo: 'li', texto: 'De 3 meses a menos de 6 meses de servicio continuo: 1 semana (7 dias naturales) de preaviso.' },
    { tipo: 'li', texto: 'De 6 meses a menos de 1 ano de servicio continuo: 15 dias de preaviso.' },
    { tipo: 'li', texto: 'Mas de 1 ano de servicio continuo: 1 mes (30 dias) de preaviso.' },
    {
      tipo: 'p',
      texto:
        'Durante el preaviso laborado, el colaborador tiene derecho a un (1) dia de asueto remunerado por semana para buscar nueva colocacion (Art. 28 inciso c del Codigo de Trabajo).',
    },
    { tipo: 'h2', texto: '## 4. Auxilio de Cesantia y Liquidacion (Art. 29)' },
    {
      tipo: 'p',
      texto:
        'El monto de la liquidacion laboral depende de la causal de terminacion segun los Articulos 28, 29, 81 y 85 del Codigo de Trabajo:',
    },
    {
      tipo: 'li',
      texto: 'Renuncia voluntaria o despido con justa causa (Art. 81 CT): Corresponde salario pendiente, vacaciones proporcionales no disfrutadas y aguinaldo proporcional. No corresponde auxilio de cesantia.',
    },
    {
      tipo: 'li',
      texto: 'Despido sin justa causa (con responsabilidad patronal, Art. 29 y 85 CT): Corresponde salario pendiente, vacaciones proporcionales, aguinaldo proporcional, preaviso (si no se laboro) y auxilio de cesantia calculado segun la escala progresiva del Articulo 29 del Codigo de Trabajo (con tope legal maximo de 8 anos).',
    },
    {
      tipo: 'p',
      texto:
        'TicoSoft S.A. realiza el deposito de la liquidacion final junto con la carta de servicio (Art. 35 CT) en un plazo maximo de quince (15) dias habiles posteriores a la fecha efectiva de salida.',
    },
  ];

  await crearPdf(path.join(OUTPUT_DIR, '04_Manual_Onboarding_y_Salida_TicoSoft.pdf'), lineas);
}

async function generarPolitica05Privacidad() {
  const bloques = [
    { tipo: 'meta', texto: 'Titulo: Aviso de Privacidad y Proteccion de Datos del Colaborador - TicoSoft S.A.' },
    { tipo: 'meta', texto: 'Version: v1.3' },
    { tipo: 'meta', texto: 'Fecha de vigencia: 2026-01-01' },
    { tipo: 'meta', texto: 'Responsable: Cumplimiento Legal y RRHH (Ana Solis Vargas)' },
    { tipo: 'titulo', texto: 'Aviso de Privacidad y Proteccion de Datos del Colaborador - TicoSoft S.A.' },
    { tipo: 'h2', texto: '## 1. Marco Legal Aplicable (Ley N. 8968 de Costa Rica)' },
    {
      tipo: 'p',
      texto:
        'El tratamiento de datos personales de los 250 colaboradores de TicoSoft S.A. se rige estrictamente por la Ley N. 8968, Ley de Proteccion de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica, su Reglamento y las disposiciones de la Agencia de Proteccion de Datos de los Habitantes (PRODHAB).',
    },
    { tipo: 'h2', texto: '## 2. Confidencialidad y Prohibicion de Divulgacion a Terceros' },
    {
      tipo: 'p',
      texto:
        'Los datos salariales, montos de salario base, deducciones, saldos individuales de vacaciones, diagnosticos o boletas de incapacidad, evaluaciones de desempeno y movimientos disciplinarios constituyen informacion privada y de acceso restringido.',
    },
    {
      tipo: 'li',
      texto: 'Queda estrictamente prohibido consultar, divulgar o compartir el salario, vacaciones, incapacidades o datos personales de otro companero o jefatura (incluyendo al Gerente General o cualquier colaborador individual).',
    },
    {
      tipo: 'li',
      texto: 'El Portal de Consulta de RRHH valida la sesion autenticada en el servidor mediante cookie HttpOnly y solo entrega datos personales al titular de la cuenta o al personal autorizado de RRHH en reportes agregados y anonimizados cuando corresponda.',
    },
    { tipo: 'h2', texto: '## 3. Derechos ARCO (Acceso, Rectificacion, Cancelacion y Oposicion)' },
    {
      tipo: 'p',
      texto:
        'Conforme a los Articulos 6 y 7 de la Ley N. 8968, todo colaborador titular de datos personales puede ejercer gratuitamente sus derechos ARCO ante el Departamento de Recursos Humanos:',
    },
    { tipo: 'li', texto: 'Acceso: Consultar sus propios datos personales, historial laboral, saldo de vacaciones e incapacidades registradas.' },
    { tipo: 'li', texto: 'Rectificacion: Solicitar la correccion de datos inexactos, desactualizados o incompletos.' },
    { tipo: 'li', texto: 'Cancelacion: Solicitar la eliminacion o bloqueo cuando los datos ya no sean necesarios conforme a los plazos legales de retencion laboral y tributaria.' },
    { tipo: 'li', texto: 'Oposicion: Oponerse al tratamiento de datos para fines distintos a la relacion laboral cuando exista motivo legitimo.' },
    { tipo: 'h2', texto: '## 4. Retencion y Seguridad de la Informacion' },
    {
      tipo: 'p',
      texto:
        'Los expedientes laborales se resguardan bajo control de acceso basado en roles, cifrado de credenciales con bcrypt, comunicacion segura y auditoria de consultas. Las solicitudes de ejercicio de derechos ARCO se atienden en un plazo maximo de cinco (5) dias habiles mediante correo interno a privacidad.rrhh@ticosoft.cr.',
    },
  ];

  await crearDocxDesdeBloques(
    path.join(OUTPUT_DIR, '05_Aviso_Privacidad_Datos_Colaborador_TicoSoft.docx'),
    bloques
  );
}

async function main() {
  ensureDir(OUTPUT_DIR);
  await generarPolitica01Vacaciones();
  await generarPolitica02Incapacidades();
  generarPolitica03SalarialExcel();
  await generarPolitica04OnboardingSalida();
  await generarPolitica05Privacidad();
  console.log(`[OK] 5 politicas generadas en ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('[Error] No se pudieron generar las politicas:', err);
  process.exit(1);
});
