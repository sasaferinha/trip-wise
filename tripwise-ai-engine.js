// TripWise AI Engine
export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export const tripwiseAIConfig = {
  version: '20260703-ai-1',
  modules: ['orcamento', 'roteiro', 'comparacao', 'checklist', 'perfil'],
  confidenceLevels: ['Alta', 'Média', 'Baixa']
};
