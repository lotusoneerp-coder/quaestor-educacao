<?php
/**
 * Quaestor Educação — aviso por e-mail de cada pedido de proposta do formulário do site.
 *
 * Destino FIXO (governança). O script não aceita destinatário vindo do navegador: não serve de relay.
 * Mesmas regras do Quaestor Profile: validação, consentimento, armadilha antispam, tempo mínimo e limite por IP.
 * Os pedidos também são gravados no Quaestor Profile (registro oficial); este e-mail é o aviso à equipe.
 */
declare(strict_types=1);
ini_set('display_errors', '0');   // nunca expor caminhos/avisos ao navegador

const DESTINO   = 'governanca@quaestoradvisors.com.br';
const REMETENTE = 'nao-responda@quaestoreducacao.com.br';
const ORIGEM    = 'https://quaestoreducacao.com.br';
const LIMITE_IP_10MIN = 5;
const LIMITE_DIA      = 200;
const TEMPO_MINIMO_MS = 2500;

const SOLUCOES = [
    'neurovendas'               => 'Neurovendas (treinamento comercial)',
    'neurovendas-ia'            => 'Neurovendas IA (Quaestor Profile)',
    'desenvolvimento-humano'    => 'Desenvolvimento Humano',
    'lideranca-gestao'          => 'Liderança e Gestão',
    'educacao-financeira'       => 'Educação Financeira',
    'desenvolvimento-comercial' => 'Desenvolvimento Comercial',
    'formacao-profissional'     => 'Formação Profissional',
    'nr1-saude-emocional'       => 'NR-1: capacitação em fatores psicossociais',
    'programa-personalizado'    => 'Programa personalizado / ainda não sei',
];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder(int $status, array $dados): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function linha(string $v, int $max): string
{
    // remove quebras de linha e caracteres de controle (impede injeção de cabeçalhos)
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'mensagem' => 'Método não permitido.']);
}

// Só aceita chamadas do próprio site (navegador)
$origem = rtrim((string)($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
if ($origem !== ORIGEM) {
    responder(403, ['ok' => false, 'mensagem' => 'Origem não permitida.']);
}

$bruto = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode((string)$bruto, true);
if (!is_array($d)) {
    responder(400, ['ok' => false, 'mensagem' => 'Dados inválidos.']);
}

// Armadilha: robô recebe "ok" e nada é enviado
if (trim((string)($d['site'] ?? '')) !== '') {
    responder(200, ['ok' => true]);
}

// Limite por IP e diário (arquivos fora da pasta pública)
$pasta = dirname(__DIR__, 2) . '/qe-dados';
if (!is_dir($pasta)) {
    @mkdir($pasta, 0700, true);
}
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'desconhecido');
$agora = time();
$arqIp = $pasta . '/ip-' . hash('sha256', $ip) . '.json';
$historico = is_file($arqIp) ? (json_decode((string)file_get_contents($arqIp), true) ?: []) : [];
$historico = array_values(array_filter($historico, fn($t) => is_int($t) && $t > $agora - 600));
if (count($historico) >= LIMITE_IP_10MIN) {
    responder(429, ['ok' => false, 'mensagem' => 'Muitas tentativas. Aguarde alguns minutos e tente novamente.']);
}
$arqDia = $pasta . '/dia-' . gmdate('Ymd') . '.txt';
$hoje = is_file($arqDia) ? (int)file_get_contents($arqDia) : 0;
if ($hoje >= LIMITE_DIA) {
    responder(429, ['ok' => false, 'mensagem' => 'Limite diário atingido. Ligue para (11) 91281-6811.']);
}

// Validação (mesmas regras do formulário e do Quaestor Profile)
$campos = [];
$nome = linha((string)($d['nome'] ?? ''), 120);
$empresa = linha((string)($d['empresa'] ?? ''), 160);
$email = strtolower(linha((string)($d['email'] ?? ''), 160));
$whats = preg_replace('/\D/', '', (string)($d['whatsapp'] ?? '')) ?? '';
if (str_starts_with($whats, '55') && in_array(strlen($whats), [12, 13], true)) {
    $whats = substr($whats, 2);
}
$solucao = (string)($d['solucao'] ?? '');
$participantes = $d['participantes'] ?? null;
$mensagem = mb_substr(trim(str_replace("\r", '', (string)($d['mensagem'] ?? ''))), 0, 2000);
$protocolo = preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($d['protocolo'] ?? ''))) ?? '';
$pagina = linha(explode('?', (string)($d['pagina'] ?? ''))[0], 200);

if (mb_strlen($nome) < 3) $campos['nome'] = 'Informe seu nome completo.';
if (mb_strlen($empresa) < 2) $campos['empresa'] = 'Informe o nome da empresa.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $campos['email'] = 'Informe um e-mail válido.';
if (!in_array(strlen($whats), [10, 11], true) || $whats[0] === '0') $campos['whatsapp'] = 'Informe o WhatsApp com DDD.';
if (!array_key_exists($solucao, SOLUCOES)) $campos['solucao'] = 'Escolha uma solução da lista.';
if ($participantes !== null && $participantes !== '' && (!is_numeric($participantes) || (int)$participantes < 1 || (int)$participantes > 100000)) {
    $campos['participantes'] = 'Informe um número entre 1 e 100.000.';
}
if (mb_strlen($mensagem) < 10) $campos['mensagem'] = 'Escreva uma mensagem com pelo menos 10 caracteres.';
if ($campos) {
    responder(422, ['ok' => false, 'mensagem' => 'Verifique os dados informados.', 'campos' => $campos]);
}
if (($d['consentimento'] ?? false) !== true) {
    responder(422, ['ok' => false, 'mensagem' => 'É preciso concordar com o Aviso de Privacidade.']);
}
if ((int)($d['tempo_ms'] ?? 0) < TEMPO_MINIMO_MS) {
    responder(422, ['ok' => false, 'mensagem' => 'Envio rápido demais. Revise os dados e envie novamente.']);
}

$fone = strlen($whats) === 11
    ? sprintf('(%s) %s-%s', substr($whats, 0, 2), substr($whats, 2, 5), substr($whats, 7))
    : sprintf('(%s) %s-%s', substr($whats, 0, 2), substr($whats, 2, 4), substr($whats, 6));
$quando = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y H:i');
$solNome = SOLUCOES[$solucao];

$assunto = 'Nova solicitação de proposta — ' . $solNome . ' — ' . $empresa;
$corpo = "Nova solicitação de proposta pelo site da Quaestor Educação\n"
    . "==========================================================\n\n"
    . "Nome:            {$nome}\n"
    . "Empresa:         {$empresa}\n"
    . "E-mail:          {$email}\n"
    . "WhatsApp:        {$fone}  (https://wa.me/55{$whats})\n"
    . "Solução:         {$solNome}\n"
    . 'Participantes:   ' . (($participantes === null || $participantes === '') ? 'não informado' : (string)(int)$participantes) . "\n"
    . "Recebido em:     {$quando} (horário de Brasília)\n"
    . ($protocolo !== '' ? "Protocolo:       {$protocolo} (registrado no Quaestor Profile)\n" : "Protocolo:       — (Quaestor Profile indisponível no momento; este e-mail é o registro)\n")
    . "\nMensagem:\n---------\n{$mensagem}\n\n"
    . "----------------------------------------------------------\n"
    . "Consentimento LGPD: aceito (Aviso de Privacidade " . linha((string)($d['privacidade_versao'] ?? ''), 20) . ").\n"
    . "Página: {$pagina}\n"
    . "Para responder, use \"Responder\": a resposta vai direto para {$email}.\n";

$cabecalhos = implode("\r\n", [
    'From: =?UTF-8?B?' . base64_encode('Site Quaestor Educação') . '?= <' . REMETENTE . '>',
    'Reply-To: =?UTF-8?B?' . base64_encode($nome) . '?= <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Quaestor-Origem: site-educacao',
]);

$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($assunto) . '?=', $corpo, $cabecalhos, '-f' . REMETENTE);
if (!$enviado) {
    responder(502, ['ok' => false, 'mensagem' => 'Não foi possível enviar agora.']);
}

$historico[] = $agora;
@file_put_contents($arqIp, json_encode($historico), LOCK_EX);
@file_put_contents($arqDia, (string)($hoje + 1), LOCK_EX);
responder(200, ['ok' => true]);
