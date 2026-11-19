import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('./AbsenceJustificationPanel.css', () => ({}));
jest.mock('../../services/api', () => ({
  api: {
    getDocuments: jest.fn(),
    uploadDocument: jest.fn(),
    updateDocumentStatus: jest.fn(),
  },
}));

const { render, screen, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const AbsenceJustificationPanel = require('./AbsenceJustificationPanel').default;
const DocumentsInbox = require('../DocumentsInbox/DocumentsInbox').default;
const { api } = require('../../services/api');

describe('AbsenceJustificationPanel y DocumentsInbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getDocuments.mockResolvedValue([
      {
        id: 101,
        name: 'boleta-ccss.pdf',
        person: 'Diego Chaves',
        status: 'Pendiente',
        tipo_justificacion_etiqueta: 'Incapacidad CCSS',
        fecha_inicio_ausencia: '2026-11-18',
        fecha_fin_ausencia: '2026-11-19',
        observacion: 'Boleta emitida en clínica local',
        uploadedAt: '2026-11-19T08:00:00Z',
        url: '/api/documents/101/archivo',
      },
    ]);
    api.uploadDocument.mockResolvedValue({
      id: 102,
      name: 'defuncion.pdf',
      person: 'Diego Chaves',
      status: 'Pendiente',
      tipo_justificacion_etiqueta: 'Duelo por fallecimiento de familiar',
      fecha_inicio_ausencia: '2026-11-17',
      fecha_fin_ausencia: '2026-11-19',
      observacion: 'Permiso por duelo primer grado',
      uploadedAt: '2026-11-19T11:00:00Z',
      url: '/api/documents/102/archivo',
    });
  });

  test('cambia la guía dinámica al seleccionar duelo y envía justificación con fechas pasadas recientes', async () => {
    const user = userEvent.setup();
    render(<AbsenceJustificationPanel />);

    await waitFor(() => expect(screen.getByText('boleta-ccss.pdf')).toBeInTheDocument());

    const select = screen.getByLabelText(/Tipo de justificación/i);
    await user.selectOptions(select, 'duelo_familiar');
    expect(screen.getByText(/3 días hábiles para primer grado/i)).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['pdf-demo'], 'defuncion.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: /Enviar justificación a RRHH/i }));

    await waitFor(() => {
      expect(api.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          tipo_justificacion: 'duelo_familiar',
        })
      );
    });
    expect(screen.getByText('defuncion.pdf')).toBeInTheDocument();
  });

  test('DocumentsInbox muestra tipo de justificación, fechas de ausencia y observación para RRHH', () => {
    render(
      <DocumentsInbox
        documents={[
          {
            id: 201,
            name: 'citacion-tse.pdf',
            person: 'Diego Chaves',
            status: 'Pendiente',
            tipo_justificacion_etiqueta: 'Citación judicial o deber cívico',
            fecha_inicio_ausencia: '2026-11-18',
            fecha_fin_ausencia: '2026-11-18',
            observacion: 'Comparecencia matutina',
            uploadedAt: '2026-11-19T09:00:00Z',
            url: '/api/documents/201/archivo',
          },
        ]}
        onReviewed={jest.fn()}
      />
    );

    expect(screen.getByText('Citación judicial o deber cívico')).toBeInTheDocument();
    expect(screen.getByText('Fecha 2026-11-18')).toBeInTheDocument();
    expect(screen.getByText('Comparecencia matutina')).toBeInTheDocument();
  });
});
