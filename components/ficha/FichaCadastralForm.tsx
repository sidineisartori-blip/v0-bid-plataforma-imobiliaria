'use client'

import { useState } from 'react'

interface Props {
  token: string
  ficha: {
    nome_pre?: string | null
    email_pre?: string | null
    corretores?: { full_name: string; phone?: string | null; creci?: string | null; city?: string | null } | null
  }
}

const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']

export default function FichaCadastralForm({ token, ficha }: Props) {
  const corretor = ficha.corretores
  const [step, setStep] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: ficha.nome_pre || '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: 'Solteiro(a)',
    email: ficha.email_pre || '',
    telefone: '',
    profissao: '',
    renda_mensal: '',
    cep: '',
    endereco_atual: '',
    referencia_1_nome: '',
    referencia_1_fone: '',
    referencia_2_nome: '',
    referencia_2_fone: '',
    tem_fiador: false,
    observacoes: '',
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function formatCPF(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 11)
    if (n.length <= 3) return n
    if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`
    if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`
    return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`
  }

  function formatPhone(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 11)
    if (n.length <= 2) return `(${n}`
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  }

  async function submit() {
    setEnviando(true)
    setErro('')
    try {
      const res = await fetch(`/api/ficha/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, renda_mensal: form.renda_mensal.replace(/\D/g, '') }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErro(d.error || 'Erro ao enviar.')
        return
      }
      setEnviado(true)
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    border: '1px solid #DDD8D0', borderRadius: 6, outline: 'none',
    backgroundColor: '#fff', color: '#1A1A1A', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
  }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✓</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1A1A1A', marginBottom: 10 }}>Ficha enviada com sucesso!</h1>
          <p style={{ color: '#6B6560', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            {corretor?.full_name ? `${corretor.full_name} receberá` : 'O corretor receberá'} seus dados e entrará em contato em breve para confirmar os próximos passos.
          </p>
          {corretor?.phone && (
            <a
              href={`https://wa.me/55${corretor.phone.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#25D366', color: '#fff', padding: '12px 24px', borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar com o corretor
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A1A', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>BID</div>
          <div style={{ fontSize: 11, color: 'rgba(240,237,230,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ficha Cadastral</div>
        </div>
        {corretor && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#F0EDE6', fontWeight: 600 }}>{corretor.full_name}</div>
            {corretor.creci && <div style={{ fontSize: 11, color: 'rgba(240,237,230,0.5)' }}>CRECI {corretor.creci}</div>}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        {/* Progress */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            {['Dados Pessoais', 'Dados Profissionais', 'Referências'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: step > i + 1 ? '#2E7D52' : step === i + 1 ? '#C9A84C' : '#DDD8D0',
                  color: step >= i + 1 ? '#fff' : '#9B9690', fontSize: 13, fontWeight: 700,
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? '#1A1A1A' : '#9B9690', display: 'none' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 4, backgroundColor: '#DDD8D0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: '#C9A84C', borderRadius: 2, width: `${((step - 1) / 2) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#6B6560', fontWeight: 600 }}>
            Etapa {step} de 3 — {['Dados Pessoais', 'Dados Profissionais', 'Referências e Confirmação'][step - 1]}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #EAE7E1', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

          {/* STEP 1 — Dados pessoais */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A1A', margin: 0 }}>Dados Pessoais</h2>

              <div><label style={lbl}>Nome completo *</label><input required value={form.nome} onChange={e => set('nome', e.target.value)} style={inp} placeholder="Como aparece no documento" /></div>

              <div style={grid2}>
                <div><label style={lbl}>CPF *</label><input required value={form.cpf} onChange={e => set('cpf', formatCPF(e.target.value))} style={inp} placeholder="000.000.000-00" /></div>
                <div><label style={lbl}>RG *</label><input required value={form.rg} onChange={e => set('rg', e.target.value)} style={inp} placeholder="Número do RG" /></div>
              </div>

              <div style={grid2}>
                <div><label style={lbl}>Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} style={inp} /></div>
                <div>
                  <label style={lbl}>Estado civil *</label>
                  <select value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)} style={inp}>
                    {ESTADOS_CIVIS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={grid2}>
                <div><label style={lbl}>E-mail *</label><input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inp} placeholder="seu@email.com" /></div>
                <div><label style={lbl}>Telefone / WhatsApp *</label><input required value={form.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} style={inp} placeholder="(00) 00000-0000" /></div>
              </div>

              <div><label style={lbl}>CEP</label><input value={form.cep} onChange={e => set('cep', e.target.value.replace(/\D/g,'').slice(0,8))} style={inp} placeholder="00000-000" /></div>
              <div><label style={lbl}>Endereço atual completo</label><input value={form.endereco_atual} onChange={e => set('endereco_atual', e.target.value)} style={inp} placeholder="Rua, número, bairro, cidade — UF" /></div>

              <button
                onClick={() => {
                  if (!form.nome || !form.cpf || !form.rg || !form.email || !form.telefone) { setErro('Preencha todos os campos obrigatórios (*)'); return }
                  setErro(''); setStep(2)
                }}
                style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
              >
                Continuar →
              </button>
              {erro && <div style={{ fontSize: 13, color: '#DC2626', textAlign: 'center' }}>{erro}</div>}
            </div>
          )}

          {/* STEP 2 — Dados profissionais */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A1A', margin: 0 }}>Dados Profissionais</h2>

              <div style={grid2}>
                <div><label style={lbl}>Profissão / Ocupação *</label><input required value={form.profissao} onChange={e => set('profissao', e.target.value)} style={inp} placeholder="Ex: Analista, Professor..." /></div>
                <div><label style={lbl}>Renda mensal (R$) *</label><input required value={form.renda_mensal} onChange={e => set('renda_mensal', e.target.value.replace(/\D/g, ''))} style={inp} placeholder="Ex: 5000" /></div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8F7F5', borderRadius: 6, border: '1px solid #EAE7E1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#1A1A1A' }}>
                  <input type="checkbox" checked={form.tem_fiador} onChange={e => set('tem_fiador', e.target.checked)} style={{ accentColor: '#C9A84C', width: 18, height: 18 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Tenho fiador</div>
                    <div style={{ fontSize: 12, color: '#6B6560' }}>Marque se você possui um fiador para apresentar</div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, backgroundColor: '#F8F7F5', color: '#6B6560', border: '1px solid #DDD8D0', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Voltar</button>
                <button
                  onClick={() => {
                    if (!form.profissao || !form.renda_mensal) { setErro('Preencha profissão e renda.'); return }
                    setErro(''); setStep(3)
                  }}
                  style={{ flex: 2, backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Continuar →
                </button>
              </div>
              {erro && <div style={{ fontSize: 13, color: '#DC2626', textAlign: 'center' }}>{erro}</div>}
            </div>
          )}

          {/* STEP 3 — Referências + confirmação */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A1A', margin: 0 }}>Referências Pessoais</h2>
              <p style={{ fontSize: 13, color: '#6B6560', margin: 0 }}>Indique duas pessoas para referência (não familiares).</p>

              <div style={{ padding: '16px 18px', border: '1px solid #EAE7E1', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Referência 1</div>
                <div style={grid2}>
                  <div><label style={lbl}>Nome</label><input value={form.referencia_1_nome} onChange={e => set('referencia_1_nome', e.target.value)} style={inp} placeholder="Nome completo" /></div>
                  <div><label style={lbl}>Telefone</label><input value={form.referencia_1_fone} onChange={e => set('referencia_1_fone', formatPhone(e.target.value))} style={inp} placeholder="(00) 00000-0000" /></div>
                </div>
              </div>

              <div style={{ padding: '16px 18px', border: '1px solid #EAE7E1', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Referência 2</div>
                <div style={grid2}>
                  <div><label style={lbl}>Nome</label><input value={form.referencia_2_nome} onChange={e => set('referencia_2_nome', e.target.value)} style={inp} placeholder="Nome completo" /></div>
                  <div><label style={lbl}>Telefone</label><input value={form.referencia_2_fone} onChange={e => set('referencia_2_fone', formatPhone(e.target.value))} style={inp} placeholder="(00) 00000-0000" /></div>
                </div>
              </div>

              <div>
                <label style={lbl}>Observações adicionais</label>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Informações adicionais que queira compartilhar..." />
              </div>

              {/* Resumo */}
              <div style={{ padding: '16px 18px', backgroundColor: '#F0FAF4', border: '1px solid #B8E0C9', borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#1A5C35', marginBottom: 8 }}>Resumo das informações</div>
                <div style={{ color: '#2E7D52', lineHeight: 1.8 }}>
                  <div>👤 {form.nome} · {form.estado_civil}</div>
                  <div>📄 CPF: {form.cpf} · RG: {form.rg}</div>
                  <div>💼 {form.profissao} · Renda: R$ {Number(form.renda_mensal || 0).toLocaleString('pt-BR')}</div>
                  <div>📞 {form.telefone} · {form.email}</div>
                </div>
              </div>

              {erro && <div style={{ padding: '12px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, fontSize: 13, color: '#DC2626' }}>{erro}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, backgroundColor: '#F8F7F5', color: '#6B6560', border: '1px solid #DDD8D0', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Voltar</button>
                <button
                  onClick={submit}
                  disabled={enviando}
                  style={{ flex: 2, backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}
                >
                  {enviando ? 'Enviando...' : 'Enviar ficha cadastral ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9B9690', marginTop: 20 }}>
          Suas informações são protegidas conforme nossa{' '}
          <a href="/privacidade" target="_blank" style={{ color: '#C9A84C' }}>Política de Privacidade</a> (LGPD).
        </p>
      </div>
    </div>
  )
}
