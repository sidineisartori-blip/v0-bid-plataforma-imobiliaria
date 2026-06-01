export function traduzirErroAuth(erro: string): string {
  const erros: Record<string, string> = {
    'Invalid login credentials':                'E-mail ou senha incorretos.',
    'Email not confirmed':                      'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.',
    'User already registered':                  'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address':         'E-mail inválido. Verifique o endereço informado.',
    'Email rate limit exceeded':                'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'Invalid email':                            'E-mail inválido.',
    'Signup disabled':                          'Cadastros temporariamente desabilitados.',
    'over_email_send_rate_limit':               'Muitos e-mails enviados. Aguarde antes de tentar novamente.',
  }
  for (const [key, value] of Object.entries(erros)) {
    if (erro.toLowerCase().includes(key.toLowerCase())) return value
  }
  return 'Ocorreu um erro. Tente novamente em instantes.'
}
