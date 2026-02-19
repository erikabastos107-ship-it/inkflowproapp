import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const DEMO_EMAIL = 'demo@inkflow.app';
    const DEMO_PASSWORD = 'demo123456';

    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingDemo = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

    let userId: string;

    if (existingDemo) {
      userId = existingDemo.id;
    } else {
      // Create demo user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Artista Demo' }
      });

      if (createError) throw createError;
      userId = newUser.user!.id;

      // Wait a bit for the trigger to create profile
      await new Promise(r => setTimeout(r, 500));
    }

    // Update profile with demo data
    await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      name: 'Artista Demo',
      studio_name: 'InkFlow Studio',
      phone: '(11) 99999-0000',
      onboarding_done: true,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    }, { onConflict: 'user_id' });

    // Clean up old demo data first
    await supabaseAdmin.from('appointments').delete().eq('user_id', userId);
    await supabaseAdmin.from('clients').delete().eq('user_id', userId);
    await supabaseAdmin.from('materials').delete().eq('user_id', userId);
    await supabaseAdmin.from('expenses').delete().eq('user_id', userId);

    // Insert demo clients
    const { data: clients } = await supabaseAdmin.from('clients').insert([
      { user_id: userId, name: 'Ana Silva', phone: '(11) 91234-5678', email: 'ana@email.com', instagram: '@anasilva', skin_tone: 'Médio', notes: 'Prefere traços finos, tem alergia a níquel.' },
      { user_id: userId, name: 'Bruno Costa', phone: '(11) 98765-4321', email: 'bruno@email.com', instagram: '@brunocosta', skin_tone: 'Claro', notes: 'Fã de tattoos geométricas.' },
      { user_id: userId, name: 'Carla Mendes', phone: '(11) 97654-3210', email: 'carla@email.com', instagram: '@carlam', skin_tone: 'Escuro', notes: 'Quer cobrir cicatriz no braço esquerdo.' },
      { user_id: userId, name: 'Diego Rocha', phone: '(11) 96543-2109', email: 'diego@email.com', instagram: '@diegor', skin_tone: 'Médio Claro', notes: 'Clientão frequente, sempre pontual.' },
      { user_id: userId, name: 'Fernanda Lima', phone: '(11) 95432-1098', email: 'fer@email.com', instagram: '@fernandalima', skin_tone: 'Médio', notes: 'Coleção de flores no braço.' },
    ]).select();

    const clientIds = clients?.map(c => c.id) || [];

    // Generate appointments across last 3 months + future
    const now = new Date();
    const appointments = [];

    // Past completed appointments (revenue data for charts)
    const pastDates = [
      -85, -80, -75, -72, -68, -65, -60, -58, -55, -52,
      -48, -45, -42, -38, -35, -30, -28, -25, -22, -18,
      -15, -12, -10, -8, -5, -3, -2
    ];

    const services = ['Tatuagem Fineline', 'Tatuagem Realismo', 'Tatuagem Geométrica', 'Coverup', 'Touch-up', 'Lettering', 'Aquarela'];

    for (const daysAgo of pastDates) {
      const date = new Date(now);
      date.setDate(date.getDate() + daysAgo);
      date.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);
      const price = [250, 350, 450, 600, 800, 1200][Math.floor(Math.random() * 6)];
      appointments.push({
        user_id: userId,
        client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
        start_at: date.toISOString(),
        duration_min: [60, 90, 120, 180, 240][Math.floor(Math.random() * 5)],
        status: 'completed',
        service: services[Math.floor(Math.random() * services.length)],
        price_expected: price,
        price_final: price,
        deposit: price * 0.3,
      });
    }

    // Today's appointments
    const today = new Date(now);
    today.setHours(10, 0, 0, 0);
    appointments.push({
      user_id: userId,
      client_id: clientIds[0],
      start_at: today.toISOString(),
      duration_min: 120,
      status: 'confirmed',
      service: 'Tatuagem Fineline',
      price_expected: 450,
      price_final: 0,
      deposit: 150,
    });

    const today2 = new Date(now);
    today2.setHours(14, 0, 0, 0);
    appointments.push({
      user_id: userId,
      client_id: clientIds[1],
      start_at: today2.toISOString(),
      duration_min: 180,
      status: 'scheduled',
      service: 'Tatuagem Realismo',
      price_expected: 800,
      price_final: 0,
      deposit: 250,
    });

    // Future appointments
    for (let i = 1; i <= 8; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + i * 2);
      futureDate.setHours(10 + Math.floor(Math.random() * 5), 0, 0, 0);
      const price = [350, 500, 700, 1000][Math.floor(Math.random() * 4)];
      appointments.push({
        user_id: userId,
        client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
        start_at: futureDate.toISOString(),
        duration_min: [60, 120, 180][Math.floor(Math.random() * 3)],
        status: i % 3 === 0 ? 'confirmed' : 'scheduled',
        service: services[Math.floor(Math.random() * services.length)],
        price_expected: price,
        price_final: 0,
        deposit: price * 0.3,
      });
    }

    await supabaseAdmin.from('appointments').insert(appointments);

    // Insert demo materials
    await supabaseAdmin.from('materials').insert([
      { user_id: userId, name: 'Agulha RL 5', category: 'needles', unit: 'un', qty_current: 45, min_qty: 20, unit_cost: 2.5, supplier: 'Tattoo Supply BR' },
      { user_id: userId, name: 'Agulha RM 9', category: 'needles', unit: 'un', qty_current: 8, min_qty: 20, unit_cost: 2.8, supplier: 'Tattoo Supply BR' },
      { user_id: userId, name: 'Tinta Preta Dynamic', category: 'ink', unit: 'ml', qty_current: 120, min_qty: 50, unit_cost: 0.8, supplier: 'InkWorld' },
      { user_id: userId, name: 'Tinta Vermelha Eternal', category: 'ink', unit: 'ml', qty_current: 35, min_qty: 50, unit_cost: 1.2, supplier: 'InkWorld' },
      { user_id: userId, name: 'Tinta Azul Radiant', category: 'ink', unit: 'ml', qty_current: 60, min_qty: 30, unit_cost: 1.1, supplier: 'InkWorld' },
      { user_id: userId, name: 'Luva Nitrílica M', category: 'gloves', unit: 'box', qty_current: 3, min_qty: 5, unit_cost: 35.0, supplier: 'Descartáveis Pro' },
      { user_id: userId, name: 'Papel Transfer', category: 'paper', unit: 'pack', qty_current: 2, min_qty: 3, unit_cost: 45.0, supplier: 'Tattoo Supply BR' },
      { user_id: userId, name: 'Filme Plástico', category: 'film', unit: 'un', qty_current: 80, min_qty: 30, unit_cost: 0.5, supplier: 'Descartáveis Pro' },
      { user_id: userId, name: 'Álcool 70%', category: 'cleaning', unit: 'ml', qty_current: 500, min_qty: 200, unit_cost: 0.02, supplier: 'Farmácia' },
      { user_id: userId, name: 'Tips Cartridge 7M', category: 'tips', unit: 'un', qty_current: 12, min_qty: 15, unit_cost: 8.0, supplier: 'Tattoo Supply BR' },
    ]);

    // Insert demo expenses across last 3 months
    const expenseDates = [-90, -75, -60, -55, -45, -30, -28, -20, -15, -10, -5, -2];
    const expenseCategories = [
      { category: 'materials', desc: 'Reposição de tintas e agulhas', amount: 320 },
      { category: 'rent', desc: 'Aluguel do estúdio', amount: 1500 },
      { category: 'marketing', desc: 'Anúncio Instagram Ads', amount: 200 },
      { category: 'apps', desc: 'Assinatura Adobe Creative', amount: 99.90 },
      { category: 'utilities', desc: 'Conta de luz', amount: 185 },
      { category: 'materials', desc: 'Luvas e materiais descartáveis', amount: 150 },
      { category: 'rent', desc: 'Aluguel do estúdio', amount: 1500 },
      { category: 'marketing', desc: 'Cartões de visita', amount: 80 },
      { category: 'utilities', desc: 'Internet', amount: 120 },
      { category: 'materials', desc: 'Agulhas cartridge', amount: 240 },
      { category: 'apps', desc: 'InkFlow Pro', amount: 59.90 },
      { category: 'other', desc: 'Equipamento de esterilização', amount: 450 },
    ];

    const expenses = expenseDates.map((daysAgo, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysAgo);
      const exp = expenseCategories[i % expenseCategories.length];
      return {
        user_id: userId,
        date: date.toISOString().split('T')[0],
        amount: exp.amount,
        category: exp.category,
        description: exp.desc,
        payment_method: ['pix', 'credit_card', 'debit_card'][Math.floor(Math.random() * 3)],
        recurring: exp.category === 'rent' || exp.category === 'apps',
      };
    });

    await supabaseAdmin.from('expenses').insert(expenses);

    // Return credentials for sign-in
    return new Response(
      JSON.stringify({ 
        success: true, 
        email: DEMO_EMAIL, 
        password: DEMO_PASSWORD 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Demo account error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
