import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalName, existingClients } = await req.json();

    if (!originalName || !Array.isArray(existingClients)) {
      return new Response(
        JSON.stringify({ error: 'originalName and existingClients array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Normalizing client name:', originalName, 'against', existingClients.length, 'existing clients');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId = null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Prepare prompt for AI normalization
    const systemPrompt = `You are a client name normalization assistant. Your job is to identify if a client name appears to be a variation of an existing client, and if so, suggest the canonical name.

Rules:
1. Look for variations like abbreviations, different formatting, typos, or alternative names for the same organization
2. Consider common variations: "Inc" vs "Incorporated", "Corp" vs "Corporation", "LLC" vs "Limited Liability Company"
3. Consider case variations and spacing differences
4. If you find a likely match, return the existing client name that best represents the canonical form
5. Only suggest matches if you are reasonably confident (75%+ certainty)
6. If no clear match exists, suggest a standardized format of the original name
7. Return confidence as a percentage (0-100)

Respond with JSON only:
{
  "suggestedName": "canonical name or standardized format",
  "isMatch": boolean,
  "confidence": number,
  "reasoning": "brief explanation of why this is a match or standardization"
}`;

    const userPrompt = `Original client name: "${originalName}"

Existing clients:
${existingClients.map((client, index) => `${index + 1}. ${client}`).join('\n')}

Analyze if the original name matches any existing client or suggest a standardized format.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIData = await response.json();
    const aiResponse = openAIData.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parse AI response
    let normalizedData;
    try {
      normalizedData = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Log the normalization request for tracking
    if (userId) {
      await supabase
        .from('client_normalization_requests')
        .insert({
          user_id: userId,
          original_name: originalName,
          existing_clients: existingClients,
          suggested_name: normalizedData.suggestedName,
          confidence_score: normalizedData.confidence
        });
    }

    return new Response(
      JSON.stringify({
        originalName,
        suggestedName: normalizedData.suggestedName,
        isMatch: normalizedData.isMatch,
        confidence: normalizedData.confidence,
        reasoning: normalizedData.reasoning
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in normalize-client-name function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});