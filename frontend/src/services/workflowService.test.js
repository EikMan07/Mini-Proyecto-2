import { getVacationBalance, saveLocalRequest, updateLocalRequest } from './workflowService';

describe('vacation request balance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not deduct pending vacation days and deducts them after approval', () => {
    getVacationBalance();
    saveLocalRequest({
      id: 'REQ-1',
      type: 'Vacaciones',
      days: 3,
      status: 'Pendiente',
    });

    expect(getVacationBalance()).toBe(14);

    updateLocalRequest('REQ-1', 'Aprobada');

    expect(getVacationBalance()).toBe(11);
  });

  it('does not deduct vacation days when the request is rejected', () => {
    getVacationBalance();
    saveLocalRequest({
      id: 'REQ-2',
      type: 'Vacaciones',
      days: 3,
      status: 'Pendiente',
    });

    updateLocalRequest('REQ-2', 'Rechazada');

    expect(getVacationBalance()).toBe(14);
  });
});
