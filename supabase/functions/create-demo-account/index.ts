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
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Artista Demo' }
      });
      if (createError) throw createError;
      userId = newUser.user!.id;
      await new Promise(r => setTimeout(r, 500));
    }

    // Update profile
    await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      name: 'Artista Demo',
      studio_name: 'InkFlow Studio',
      phone: '(11) 99999-0000',
      onboarding_done: true,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    }, { onConflict: 'user_id' });

    // Clean up old demo data
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
      { user_id: userId, name: 'Gabriel Torres', phone: '(11) 94321-0987', email: 'gabriel@email.com', instagram: '@gabrielt', skin_tone: 'Claro', notes: 'Estilo old school, braço direito completo.' },
      { user_id: userId, name: 'Helena Souza', phone: '(11) 93210-9876', email: 'hel@email.com', instagram: '@helenasouza', skin_tone: 'Médio Escuro', notes: 'Ama aquarela e mandala.' },
    ]).select();

    const clientIds = clients?.map(c => c.id) || [];
    const services = ['Tatuagem Fineline', 'Tatuagem Realismo', 'Tatuagem Geométrica', 'Coverup', 'Touch-up', 'Lettering', 'Aquarela', 'Old School', 'Neo Traditional', 'Blackwork'];
    const now = new Date();
    const appointments = [];

    // Full year of past completed appointments (~60 sessions)
    const pastDays = [
      -355, -350, -345, -340, -335, -330, -325, -320, -315, -310,
      -305, -300, -295, -290, -285, -280, -275, -270, -265, -260,
      -255, -250, -245, -240, -235, -230, -225, -220, -215, -210,
      -205, -200, -195, -190, -185, -180, -175, -170, -165, -160,
      -155, -150, -145, -140, -135, -130, -125, -120, -115, -110,
      -105, -100, -95, -90, -85, -80, -75, -70, -65, -60,
      -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, -2
    ];

    // Prices that grow slightly over the year (simulating business growth)
    const basePrices = [250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1500];

    for (let i = 0; i < pastDays.length; i++) {
      const daysAgo = pastDays[i];
      const date = new Date(now);
      date.setDate(date.getDate() + daysAgo);
      date.setHours(9 + Math.floor(Math.random() * 7), 0, 0, 0);

      // More recent = slightly higher prices (business growing)
      const yearProgress = (pastDays.length - i) / pastDays.length;
      const priceIndex = Math.floor(yearProgress * (basePrices.length - 1));
      const price = basePrices[Math.max(0, basePrices.length - 1 - priceIndex)];

      appointments.push({
        user_id: userId,
        client_id: clientIds[i % clientIds.length],
        start_at: date.toISOString(),
        duration_min: [60, 90, 120, 150, 180, 240][Math.floor(Math.random() * 6)],
        status: 'completed',
        service: services[Math.floor(Math.random() * services.length)],
        price_expected: price,
        price_final: price,
        deposit: Math.round(price * 0.3),
      });
    }

    // Today's appointments (2)
    const today1 = new Date(now);
    today1.setHours(10, 0, 0, 0);
    appointments.push({
      user_id: userId, client_id: clientIds[0],
      start_at: today1.toISOString(), duration_min: 120,
      status: 'confirmed', service: 'Tatuagem Fineline',
      price_expected: 450, price_final: 0, deposit: 150,
    });

    const today2 = new Date(now);
    today2.setHours(14, 0, 0, 0);
    appointments.push({
      user_id: userId, client_id: clientIds[1],
      start_at: today2.toISOString(), duration_min: 180,
      status: 'scheduled', service: 'Tatuagem Realismo',
      price_expected: 800, price_final: 0, deposit: 250,
    });

    // Future appointments (10)
    for (let i = 1; i <= 10; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + i * 3);
      futureDate.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);
      const price = basePrices[Math.floor(Math.random() * basePrices.length)];
      appointments.push({
        user_id: userId,
        client_id: clientIds[i % clientIds.length],
        start_at: futureDate.toISOString(),
        duration_min: [60, 120, 180][Math.floor(Math.random() * 3)],
        status: i % 3 === 0 ? 'confirmed' : 'scheduled',
        service: services[Math.floor(Math.random() * services.length)],
        price_expected: price,
        price_final: 0,
        deposit: Math.round(price * 0.3),
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

    // Full year of expenses — monthly recurring + sporadic
    const expenses = [];

    // 12 months of recurring expenses
    for (let month = 11; month >= 0; month--) {
      const base = new Date(now);
      base.setMonth(base.getMonth() - month);
      base.setDate(5);

      expenses.push(
        { user_id: userId, date: new Date(base.setDate(5)).toISOString().split('T')[0], amount: 1500, category: 'rent', description: 'Aluguel do estúdio', payment_method: 'pix', recurring: true },
        { user_id: userId, date: new Date(base.setDate(10)).toISOString().split('T')[0], amount: 99.90, category: 'apps', description: 'Assinatura Adobe Creative', payment_method: 'credit_card', recurring: true },
        { user_id: userId, date: new Date(base.setDate(12)).toISOString().split('T')[0], amount: 59.90, category: 'apps', description: 'InkFlow Pro', payment_method: 'credit_card', recurring: true },
        { user_id: userId, date: new Date(base.setDate(15)).toISOString().split('T')[0], amount: 120 + Math.floor(Math.random() * 60), category: 'utilities', description: 'Internet e telefone', payment_method: 'debit_card', recurring: true },
        { user_id: userId, date: new Date(base.setDate(20)).toISOString().split('T')[0], amount: 150 + Math.floor(Math.random() * 80), category: 'utilities', description: 'Conta de luz', payment_method: 'pix', recurring: false },
      );

      // Sporadic: materials every ~2 months
      if (month % 2 === 0) {
        expenses.push({ user_id: userId, date: new Date(base.setDate(8)).toISOString().split('T')[0], amount: 280 + Math.floor(Math.random() * 200), category: 'materials', description: 'Reposição tintas e agulhas', payment_method: 'pix', recurring: false });
      }
      // Marketing every 3 months
      if (month % 3 === 0) {
        expenses.push({ user_id: userId, date: new Date(base.setDate(25)).toISOString().split('T')[0], amount: 150 + Math.floor(Math.random() * 150), category: 'marketing', description: 'Instagram Ads / Portfólio', payment_method: 'credit_card', recurring: false });
      }
    }

    await supabaseAdmin.from('expenses').insert(expenses);

    return new Response(
      JSON.stringify({ success: true, email: DEMO_EMAIL, password: DEMO_PASSWORD }),
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
