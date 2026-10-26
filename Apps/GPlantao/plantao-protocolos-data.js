var clinicalProtocols = [
  { id: "protocolos", title: "Protocolos", category: "Estrutura Clínica", prescription: "", orientation: "" },
  {
    id: "protocolo-dor-toracica",
    title: "Dor torácica",
    parentGroup: "protocolos",
    clinicalTemplate: true,
    orientation: "",
    prescription: `# DOR TORÁCICA — AVALIAÇÃO NO PS

# IDENTIFICAÇÃO E TEMPOS
Idade:
Sexo:
Data e horário da avaliação:
Horário de início dos sintomas:
Horário de chegada:
Dor presente durante a avaliação: [sim / não / não investigado]
Fonte da história e limitações da entrevista:

# CARACTERIZAÇÃO DA DOR
Localização: [retrosternal / precordial / hemitórax direito / hemitórax esquerdo / epigástrica / dorsal / outra]
Início: [súbito / gradual]
Intensidade máxima desde o início: [sim / não / não investigado]
Circunstância de início: [repouso / esforço / estresse emocional / alimentação / durante o sono / outra]
Característica: [aperto / pressão / peso / queimação / pontada / facada / rasgamento / outra]
Intensidade inicial: __/10
Maior intensidade: __/10
Intensidade atual: __/10
Irradiação: [sem irradiação / braço esquerdo / braço direito / ambos os braços / ombros / mandíbula / pescoço / dorso / epigástrio / outra]
Duração de cada episódio:
Frequência dos episódios:
Último episódio:
Padrão: [contínuo / intermitente]
Evolução: [melhora / piora / inalterada]
Aumento recente da frequência, duração ou intensidade:
Ocorrência com esforços menores ou em repouso:
Fatores de piora: [esforço / inspiração / tosse / movimento do tronco / movimento dos braços / palpação / decúbito / alimentação / deglutição / outro]
Fatores de melhora: [repouso / mudança de posição / inclinação anterior / medicação / outro]
Medicamentos utilizados para a dor — dose, horário, resposta e tempo até melhora:
Dor reproduzida à palpação:
Dor reproduzida por movimentos:
Limitação funcional provocada:
Episódios anteriores semelhantes:
Semelhança com angina ou IAM prévios:
Investigação anterior e respectivos resultados:

# SINTOMAS ASSOCIADOS
Registrar cada item como presente, negado após investigação ou não investigado.
Dispneia: não investigado
  Início e relação temporal com a dor:
  Aos esforços ou em repouso:
  Ortopneia / dispneia paroxística noturna:
Sudorese fria: não investigado
Náuseas: não investigado
Vômitos: não investigado
Palpitações: não investigado
Tontura / pré-síncope: não investigado
Síncope: não investigado
Astenia ou fadiga incomum: não investigado
Desconforto epigástrico: não investigado
Dor mandibular ou nos braços sem dor torácica: não investigado
Febre: não investigado
Tosse / expectoração: não investigado
Hemoptise: não investigado
Dor ou edema unilateral de membro inferior: não investigado
Déficit motor ou sensitivo: não investigado
Alteração da fala ou visão: não investigado
Confusão / alteração da consciência: não investigado
Disfagia / odinofagia: não investigado
Pirose / regurgitação: não investigado
Vômitos intensos precedendo a dor: não investigado
Lesões cutâneas ou vesículas: não investigado
Trauma torácico recente: não investigado

# AP — ANTECEDENTES PESSOAIS
HAS:
Diabetes:
Dislipidemia:
Obesidade:
Doença arterial coronariana:
IAM prévio — data:
Angioplastia / stent — data:
Cirurgia de revascularização — data:
Insuficiência cardíaca — fração de ejeção conhecida:
Arritmias:
Valvopatia:
AVC / AIT:
Doença arterial periférica:
Doença renal crônica / diálise:
Asma / DPOC:
TVP / TEP prévios:
Aneurisma ou doença conhecida da aorta:
Doença do tecido conjuntivo:
Neoplasia:
Outros antecedentes:

# HISTÓRIA FAMILIAR E HÁBITOS
DAC prematura em familiar de primeiro grau — parentesco e idade do evento:
Morte súbita:
Doença da aorta / dissecção:
Tabagismo atual ou prévio — carga tabágica e tempo de cessação:
Cocaína / anfetaminas / outros estimulantes — substância e horário do último uso:
Etilismo:
Atividade física habitual:

# CONTEXTO PARA DIAGNÓSTICOS DIFERENCIAIS
Cirurgia / internação / imobilização recentes:
Viagem prolongada:
Trauma recente:
Uso de estrogênio:
Gestação / puerpério:
Trombofilia:
Infecção recente:
Procedimento vascular / manipulação da aorta recente:
Procedimento esofágico recente:
Outros fatores pertinentes:

# MUC
Medicamentos, doses e adesão:
AAS / outro antiagregante — última dose:
Anticoagulante — qual e última dose:
Betabloqueador:
Nitrato:
Sildenafil / tadalafil / similares — substância e horário:
Outros:

# ALERGIAS
Medicamentos e tipo de reação:
Reação prévia a contraste:

# CLASSIFICAÇÃO CLÍNICA
Tipo de dor: [A / B / C / D / não definida]
Justificativa:
Suspeita clínica de SCA: [alta / moderada / baixa / não definida]
Elementos que sustentam a classificação:

# EXAME FÍSICO DIRECIONADO
PA:
FC:
FR:
SpO₂:
Temperatura:
Estado geral / consciência:
Perfusão periférica:
Ausculta cardíaca — ritmo, sopros e atrito:
Ausculta pulmonar — simetria, estertores e outros achados:
Turgência jugular:
Edema periférico:
Pulsos periféricos / assimetria:
PA em ambos os braços, quando pertinente:
Parede torácica — dor à palpação e lesões:
Membros inferiores — assimetria, edema e sinais de TVP:
Exame neurológico dirigido:
Outros achados:

# ECG
Horário de realização:
Dor presente durante o registro:
Ritmo / frequência:
Alterações de ST:
Alterações de T:
Bloqueios / outras alterações:
Comparação com ECG anterior:
ECG seriado — horário e evolução:

# TROPONINA
Método / ensaio: [convencional / alta sensibilidade]
Unidade e limite superior de referência do laboratório:
1ª coleta — horário / valor:
2ª coleta — horário / valor:
Coletas adicionais:
Intervalo entre início dos sintomas e primeira coleta:
Variação entre medidas:
Protocolo de interpretação utilizado:

# ESTRATIFICAÇÃO CORONARIANA
Escore / versão adotada pelo serviço:
HEART, quando aplicável:
H — História: __ pontos
E — ECG: __ pontos
A — Idade: __ pontos
R — Fatores de risco / aterosclerose conhecida: __ pontos
T — Troponina: __ pontos
Total:
Dados pendentes:
Interpretação em conjunto com ECG, troponina seriada e protocolo institucional:

EDACS, se utilizado como alternativa:
Pontuação:
ECG:
Troponinas seriadas:
Conclusão do protocolo:

# OUTROS ESCORES — CONFORME SUSPEITA CLÍNICA
Suspeita de TEP:
  Probabilidade clínica:
  Wells ou Geneva — versão / resultado:
  PERC, apenas se aplicável ao contexto:
  Investigação realizada:
Suspeita de síndrome aórtica aguda:
  ADD-RS — condições predisponentes:
  Características da dor:
  Achados do exame:
  Resultado / investigação realizada:
SCA estabelecida:
  GRACE, quando indicado — resultado:

# REAVALIAÇÃO
Horário:
Dor atual: __/10
Evolução dos sinais vitais:
Novos sintomas ou achados:
Resultados disponíveis:
Resposta às medidas realizadas:
Hipóteses consideradas e justificativa:
Pendências:
Conduta e destino:`
  }
];

function clinicalDraftKey(protocol) {
  return "gplantao-" + protocol.id + "-draft-v1";
}

function loadClinicalDraft(protocol) {
  if (typeof getClinicalFormDraft === "function") return getClinicalFormDraft(protocol).result;
  try {
    var saved = localStorage.getItem(clinicalDraftKey(protocol));
    var draft = saved ? JSON.parse(saved) : null;
    if (draft && typeof draft.text === "string") return draft.text;
  } catch (error) {}
  return protocol.prescription;
}

function saveClinicalDraft(protocol) {
  if (typeof getClinicalFormDraft === "function") {
    persistClinicalForm(protocol, getClinicalFormDraft(protocol));
    return;
  }
  try {
    localStorage.setItem(clinicalDraftKey(protocol), JSON.stringify({ text: state.editableText, savedAt: new Date().toISOString() }));
  } catch (error) {}
}

function renderClinicalProtocolHub(content) {
  var card = div("card");
  var header = div("header");
  var title = document.createElement("h1");
  title.textContent = "Protocolos";
  header.appendChild(title);
  card.appendChild(header);
  var body = div("body stack");
  var note = document.createElement("p");
  note.textContent = "Selecione um protocolo para abrir o roteiro de avaliação.";
  body.appendChild(note);
  clinicalProtocols.filter(function (item) { return item.parentGroup === "protocolos"; }).forEach(function (item) {
    body.appendChild(textButton(item.title, "text-btn", function () { selectProtocol(item.id); }));
  });
  card.appendChild(body);
  content.appendChild(card);
}

function renderChestPainGuide(body) {
  var guide = document.createElement("details");
  guide.className = "panel";
  var summary = document.createElement("summary");
  summary.textContent = "Classificação da dor e uso dos escores";
  guide.appendChild(summary);
  var text = document.createElement("p");
  text.textContent = "Classificação tradicional: A — definitivamente anginosa; B — provavelmente anginosa; C — provavelmente não anginosa; D — definitivamente não anginosa. A diretriz SBC 2025 prefere suspeita de SCA alta, moderada ou baixa. O tipo da dor isoladamente não exclui SCA. Preencha apenas os achados investigados. Os escores devem ser interpretados com ECG, troponinas e o protocolo do serviço; o total isolado não define alta.";
  guide.appendChild(text);
  var source = document.createElement("a");
  source.href = "https://www.scielo.br/j/abc/a/rLn3RmSgM5Gswg4kWTvm3WJ/?lang=pt";
  source.textContent = "Diretriz SBC de dor torácica — 2025";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  guide.appendChild(source);
  body.appendChild(guide);
}
