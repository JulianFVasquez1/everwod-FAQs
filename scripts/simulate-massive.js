const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateDrasticChanges() {
  console.log('🚀 Iniciando inyección masiva de datos para cambiar los KPIs dramáticamente...');

  // Generamos un bloque masivo de FAQs "Aprobadas" para subir la precisión enormemente
  const newFaqs = [];

  for (let i = 0; i < 150; i++) {
    const date = new Date(); // Todas de hoy
    
    newFaqs.push({
      question: `Pregunta de alta precisión generada masivamente (${i})`,
      answer: 'Respuesta excelente, aprobada para cambiar drásticamente el dashboard.',
      status: 'approved', // Todo aprobado para subir la precisión algorítmica
      created_at: date.toISOString(),
    });
  }

  const { data, error } = await supabase.from('faqs').insert(newFaqs).select();

  if (error) {
    console.error('❌ Error al insertar datos:', error);
  } else {
    console.log(`✅ ¡Se insertaron ${data.length} FAQs APROBADAS exitosamente!`);
    console.log('🔄 Refresca el Dashboard nuevamente y verás un salto gigantesco en los porcentajes.');
  }
}

simulateDrasticChanges();
