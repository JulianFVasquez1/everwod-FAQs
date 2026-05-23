
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateActivity() {
  console.log('🚀 Iniciando simulación de actividad...');

  // Generamos datos para los últimos 7 días
  const statuses = ['approved', 'rejected', 'pending'];
  const newFaqs = [];

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    newFaqs.push({
      question: `Pregunta de prueba generada el ${date.toLocaleDateString()} (${i})`,
      answer: 'Respuesta autogenerada de prueba para validar gráficos.',
      status: status,
      created_at: date.toISOString(),
    });
  }

  const { data, error } = await supabase.from('faqs').insert(newFaqs).select();

  if (error) {
    console.error('❌ Error al insertar datos:', error);
  } else {
    console.log(`✅ ¡Se insertaron ${data.length} FAQs exitosamente!`);
    console.log('🔄 Refresca la página en tu navegador para ver cómo las gráficas y métricas se actualizan.');
  }
}

simulateActivity();
