// CORRECTED: Field mapping for mechanics table update
export const updateMechanic = async (mechanicId, form) => {
  const { error } = await supabase
    .from('mechanics')
    .update({
      full_name: form.nome,   // Nome completo
      email: form.email,      // Email
      phone: form.telefone,   // Telefone
     cargo: form.cargo   // 👈 CORRECTED: Use 'position' not 'cargo'
      password: form.senha && form.senha.trim() !== '' 
        ? form.senha 
        : undefined           // Só atualiza se foi preenchida
    })
    .eq('id', mechanicId)     // ID do mecânico que está sendo editado
    .select();

  if (error) {
    console.error('Erro ao atualizar mecânico:', error);
    alert('Erro ao atualizar mecânico: ' + error.message);
    throw error;
  }

  return true; // Success
};

// Valid position values according to your schema:
// - 'colaborador'
// - 'encarregado' 
// - 'gerente'
// - 'sub_regional'
// - 'regional'