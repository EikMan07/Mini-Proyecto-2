Titulo: Informe Fase 1 - Investigacion de Normativa Laboral de Costa Rica (Mitad Eiker)
Version: v1.0
Fecha de vigencia: 2026-01-01
Responsable: Eiker (Arquitectura Backend, Datos y Normativa Laboral CR)

# Informe Tecnico Fase 1: Normativa Laboral de Costa Rica Aplicada a TicoSoft S.A.

## 1. Proposito del Documento
Este documento consolida la investigacion normativa de los cinco (5) dominios laborales asignados para la empresa simulada **TicoSoft S.A.** (250 colaboradores en Costa Rica), contrastando el piso legal obligatorio del **Codigo de Trabajo de Costa Rica**, las guias del **Ministerio de Trabajo y Seguridad Social (MTSS)**, la **CCSS**, el **INS** y la **Ley N.° 8968**, frente a las politicas internas vigentes de la organizacion.

---

## 2. Matriz Comparativa: Minimo Legal CR vs. Politica TicoSoft S.A.

| Dominio | Minimo Legal en Costa Rica | Politica TicoSoft S.A. (Mejora Documentada) | Fuente Normativa Oficial |
| :--- | :--- | :--- | :--- |
| **1. Vacaciones y Feriados** | 2 semanas remuneradas por cada 50 semanas continuas; prohibicion general de acumulacion salvo excepcion por 1 vez; feriados obligatorios y no obligatorios segun Art. 148. | **15 dias habiles anuales** (1.25 dias/mes), acumulables maximo 1 periodo con autorizacion, solicitud con **5 dias habiles** de anticipacion y cobertura salarial integra en los feriados 2026 (incluyendo 1 de diciembre). | Codigo de Trabajo Arts. 148, 152, 153, 156, 157, 158 y 159; MTSS. |
| **2. Incapacidades y Subsidios** | Enfermedad comun CCSS: dias 1–3 patrono 50%; dia 4+ CCSS 60%. Riesgos del trabajo INS desde dia 1. Maternidad: 4 meses (50% patrono / 50% CCSS). | TicoSoft complementa los dias 1–3 de enfermedad comun CCSS hasta completar el **80% del salario**; mantiene cobertura total INS para accidentes laborales y exige carga digital de boleta en maximo **48 horas habiles**. | Codigo de Trabajo Arts. 79, 95 y Titulo IV (Arts. 193+); Reglamento del Seguro de Salud CCSS; Poliza Riesgos del Trabajo INS. |
| **3. Salarios, Deducciones y Aguinaldo** | Pago maximo quincenal/mensual en moneda de curso legal; retencion de cargas obreras (CCSS SEM 5.50%, IVM 4.17%, Banco Popular 1.00% = 10.67%) e Impuesto al Salario; aguinaldo = suma de salarios dic–nov / 12 pagado antes del 20 de diciembre. | Pago puntual quincenal (dias 15 y ultimo dia habil de cada mes), desglose transparente de retenciones y deposito de Aguinaldo programado el **15 de diciembre de 2026** (5 dias antes del limite legal). | Codigo de Trabajo Arts. 139, 164, 165, 168; Ley N.° 2412 (Aguinaldo); Ley N.° 7092 Art. 33 (Renta); Ley N.° 7983 (LPT). |
| **4. Onboarding, Preaviso y Liquidacion** | Periodo de prueba maximo de 3 meses; preaviso escalonado Art. 28 (0 dias, 1 semana, 15 dias, 1 mes) con 1 dia de asueto semanal; cesantia Art. 29 (tope 8 anos) solo sin justa causa. | Plan de Onboarding estructurado en 30 dias; cumplimiento estricto de tablas de preaviso (Art. 28) y cesantia (Art. 29), con pago de liquidacion final en maximo **15 dias habiles** tras la salida. | Codigo de Trabajo Arts. 22–24, 28, 29, 35, 81 y 85; MTSS. |
| **5. Privacidad y Datos del Colaborador** | Consentimiento informado, confidencialidad, finalidad legitima y garantia de derechos ARCO frente al tratamiento de datos personales. | Prohibicion absoluta de divulgar salarios, vacaciones o incapacidades a terceros; control estricto de acceso por sesion HttpOnly y atencion de derechos ARCO en maximo **5 dias habiles**. | Ley N.° 8968 (Proteccion de la Persona frente al Tratamiento de sus Datos Personales) y Reglamento PRODHAB. |

---

## 3. Reglas de Metadatos y Preparacion para RAG
Todos los documentos generados en `documentos_drive/eiker/` incorporan en sus primeras lineas los metadatos estandarizados (`Titulo`, `Version`, `Fecha de vigencia`, `Responsable`) y encabezados de seccion explicitos (`## 1. ...`, `## 2. ...`) para garantizar fragmentacion coherente (500–1000 tokens con solapamiento de 100 tokens) y trazabilidad exacta de citas en el Agente de Politicas RAG.
