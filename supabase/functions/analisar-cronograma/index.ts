const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { relatorio } = await req.json();
    const apiKey = Deno.env.get('GROQ_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY não configurada no Supabase.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!relatorio) {
      return new Response(JSON.stringify({ error: 'Relatório não enviado.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const iaResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Você é um gerente de produção de eventos, especialista em montagem de camarotes, cenografia, elétrica, hidráulica, fornecedores, bares, mobiliário e operação. Seja objetivo, prático e priorize risco operacional.',
          },
          {
            role: 'user',
            content: relatorio,
          },
        ],
        temperature: 0.35,
        max_tokens: 4096,
      }),
    });

    const iaData = await iaResponse.json();

    if (!iaResponse.ok) {
      return new Response(JSON.stringify({ error: iaData.error?.message || 'Erro na API Groq.' }), {
        status: iaResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analise = iaData.choices?.[0]?.message?.content?.trim();

    return new Response(JSON.stringify({ analise }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro inesperado.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
