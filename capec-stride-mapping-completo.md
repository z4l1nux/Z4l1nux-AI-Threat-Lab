# Mapeamento STRIDE → CAPEC (Oficial MITRE)

Este documento mapeia as **6 categorias STRIDE** para padrões de ataque **CAPEC** (Common Attack Pattern Enumeration and Classification) conforme definido pelo MITRE.

**Fonte oficial**: https://capec.mitre.org/data/definitions/1000.html

---

## 1. Spoofing (Falsificação de Identidade)

**CAPEC-156: Engage In Deceptive Interactions**

Ameaças relacionadas à falsificação de identidade de usuários, sistemas, dados ou componentes.

### CAPECs Principais:

#### CAPEC-148: Content Spoofing
- **CAPEC-145**: Checksum Spoofing - Falsificação de checksum para passar verificações
- **CAPEC-218**: Spoofing of UDDI/ebXML Messages - Falsificação de mensagens UDDI/ebXML
- **CAPEC-502**: Intent Spoof - Falsificação de intenção (Android)
- **CAPEC-627**: Counterfeit GPS Signals - Sinais GPS falsificados
- **CAPEC-628**: Carry-Off GPS Attack - Ataque de sequestro de GPS

#### CAPEC-151: Identity Spoofing
- **CAPEC-194**: Fake the Source of Data - Falsificação da origem dos dados
- **CAPEC-275**: DNS Rebinding - Rebinding de DNS
- **CAPEC-543**: Counterfeit Websites - Sites falsificados
- **CAPEC-544**: Counterfeit Organizations - Organizações falsificadas
- **CAPEC-598**: DNS Spoofing - Falsificação de DNS
- **CAPEC-633**: Token Impersonation - Personificação de token

#### CAPEC-195: Principal Spoof
- **CAPEC-587**: Cross Frame Scripting (XFS) - Script entre frames
- **CAPEC-599**: Terrestrial Jamming - Jamming terrestre

#### CAPEC-473: Signature Spoof
- **CAPEC-459**: Creating a Rogue Certification Authority Certificate - Certificado CA falso
- **CAPEC-474**: Signature Spoofing by Key Theft - Falsificação por roubo de chave
- **CAPEC-475**: Signature Spoofing by Improper Validation - Falsificação por validação inadequada
- **CAPEC-476**: Signature Spoofing by Misrepresentation - Falsificação por deturpação
- **CAPEC-477**: Signature Spoofing by Mixing Signed and Unsigned Content - Mistura de conteúdo assinado/não-assinado
- **CAPEC-479**: Malicious Root Certificate - Certificado raiz malicioso
- **CAPEC-485**: Signature Spoofing by Key Recreation - Falsificação por recriação de chave

#### CAPEC-89: Pharming
Redirecionamento de tráfego para sites maliciosos

#### CAPEC-98: Phishing
- **CAPEC-163**: Spear Phishing - Phishing direcionado
- **CAPEC-164**: Mobile Phishing - Phishing mobile
- **CAPEC-656**: Voice Phishing - Phishing por voz

#### CAPEC-154: Resource Location Spoofing
- **CAPEC-159**: Redirect Access to Libraries - Redirecionamento de bibliotecas
- **CAPEC-132**: Symlink Attack - Ataque via symlink
- **CAPEC-38**: Leveraging/Manipulating Configuration File Search Paths - Manipulação de paths
- **CAPEC-471**: Search Order Hijacking - Sequestro de ordem de busca
- **CAPEC-641**: DLL Side-Loading - Carregamento lateral de DLL

#### CAPEC-616: Establish Rogue Location
- **CAPEC-505**: Scheme Squatting - Squatting de esquema
- **CAPEC-611**: BitSquatting - Squatting de bits
- **CAPEC-615**: Evil Twin Wi-Fi Attack - Ataque Wi-Fi gêmeo maligno
- **CAPEC-617**: Cellular Rogue Base Station - Estação base celular falsa
- **CAPEC-630**: TypoSquatting - Squatting por erro de digitação
- **CAPEC-631**: SoundSquatting - Squatting por som
- **CAPEC-632**: Homograph Attack via Homoglyphs - Ataque homográfico
- **CAPEC-667**: Bluetooth Impersonation AttackS (BIAS) - Ataque de personificação Bluetooth

#### CAPEC-173: Action Spoofing
- **CAPEC-103**: Clickjacking - Sequestro de clique
- **CAPEC-181**: Flash File Overlay - Sobreposição de arquivo Flash
- **CAPEC-222**: iFrame Overlay - Sobreposição de iFrame
- **CAPEC-501**: Android Activity Hijack - Sequestro de Activity Android
- **CAPEC-504**: Task Impersonation - Personificação de tarefa
- **CAPEC-654**: Credential Prompt Impersonation - Personificação de prompt de credenciais
- **CAPEC-506**: Tapjacking - Sequestro de toque

#### CAPEC-416: Manipulate Human Behavior
- **CAPEC-407**: Pretexting - Pretexto
- **CAPEC-412**: Pretexting via Customer Service - Pretexto via atendimento
- **CAPEC-413**: Pretexting via Tech Support - Pretexto via suporte técnico
- **CAPEC-414**: Pretexting via Delivery Person - Pretexto via entregador
- **CAPEC-415**: Pretexting via Phone - Pretexto via telefone
- **CAPEC-417**: Influence Perception - Influência de percepção
- **CAPEC-425**: Target Influence via Framing - Influência via enquadramento
- **CAPEC-426**: Influence via Incentives - Influência via incentivos
- **CAPEC-433**: Target Influence via The Human Buffer Overflow - Influência via sobrecarga humana

#### CAPEC-389: Content Spoofing Via Application API Manipulation
Falsificação de conteúdo via manipulação de API

---

## 2. Tampering (Adulteração)

Ameaças relacionadas à modificação não autorizada de dados, código, configurações ou hardware.

### CAPECs Principais:

#### CAPEC-123: Buffer Manipulation
- **CAPEC-100**: Overflow Buffers - Transbordamento de buffer
- **CAPEC-10**: Buffer Overflow via Environment Variables - Overflow via variáveis de ambiente
- **CAPEC-14**: Client-side Injection-induced Buffer Overflow - Overflow induzido no cliente
- **CAPEC-24**: Filter Failure through Buffer Overflow - Falha de filtro via overflow
- **CAPEC-256**: SOAP Array Overflow - Overflow de array SOAP
- **CAPEC-42**: MIME Conversion - Conversão MIME maliciosa
- **CAPEC-44**: Overflow Binary Resource File - Overflow de arquivo binário
- **CAPEC-45**: Buffer Overflow via Symbolic Links - Overflow via links simbólicos
- **CAPEC-46**: Overflow Variables and Tags - Overflow de variáveis e tags
- **CAPEC-47**: Buffer Overflow via Parameter Expansion - Overflow via expansão de parâmetro
- **CAPEC-8**: Buffer Overflow in an API Call - Overflow em chamada de API
- **CAPEC-9**: Buffer Overflow in Local Command-Line Utilities - Overflow em utilitários locais
- **CAPEC-540**: Overread Buffers - Leitura excessiva de buffers

#### CAPEC-129: Pointer Manipulation
Manipulação de ponteiros para alterar fluxo ou dados

#### CAPEC-153: Input Data Manipulation
- **CAPEC-126**: Path Traversal - Travessia de caminho
- **CAPEC-139**: Relative Path Traversal - Travessia de caminho relativo
- **CAPEC-597**: Absolute Path Traversal - Travessia de caminho absoluto
- **CAPEC-76**: Manipulating Web Input to File System Calls - Manipulação de entrada web
- **CAPEC-128**: Integer Attacks - Ataques de inteiro
- **CAPEC-92**: Forced Integer Overflow - Overflow de inteiro forçado
- **CAPEC-267**: Leverage Alternate Encoding - Uso de codificação alternativa
- **CAPEC-120**: Double Encoding - Codificação dupla
- **CAPEC-3**: Using Leading 'Ghost' Character Sequences - Sequências fantasma
- **CAPEC-4**: Using Alternative IP Address Encodings - Codificação alternativa de IP
- **CAPEC-52**: Embedding NULL Bytes - Bytes NULL embutidos
- **CAPEC-64**: Using Slashes and URL Encoding Combined - Barras e codificação URL
- **CAPEC-71**: Using Unicode Encoding - Codificação Unicode
- **CAPEC-72**: URL Encoding - Codificação de URL
- **CAPEC-165**: File Manipulation - Manipulação de arquivo
- **CAPEC-73**: User Controlled Filename - Nome de arquivo controlado por usuário
- **CAPEC-74**: Manipulating State - Manipulação de estado
- **CAPEC-75**: Manipulating Writeable Configuration Files - Manipulação de arquivos de configuração

#### CAPEC-272: Protocol Manipulation
- **CAPEC-220**: Client-Server Protocol Manipulation - Manipulação de protocolo cliente-servidor
- **CAPEC-33**: HTTP Request Smuggling - Contrabando de requisição HTTP
- **CAPEC-34**: HTTP Response Splitting - Divisão de resposta HTTP
- **CAPEC-105**: HTTP Request Splitting - Divisão de requisição HTTP
- **CAPEC-273**: HTTP Response Smuggling - Contrabando de resposta HTTP
- **CAPEC-274**: HTTP Verb Tampering - Adulteração de verbo HTTP
- **CAPEC-278**: Web Services Protocol Manipulation - Manipulação de protocolo web services
- **CAPEC-279**: SOAP Manipulation - Manipulação SOAP

#### CAPEC-161: Infrastructure Manipulation
- **CAPEC-481**: Contradictory Destinations in Traffic Routing Schemes - Destinos contraditórios
- **CAPEC-166**: Force the System to Reset Values - Forçar reset de valores
- **CAPEC-141**: Cache Poisoning - Envenenamento de cache
- **CAPEC-142**: DNS Cache Poisoning - Envenenamento de cache DNS

#### CAPEC-184: Software Integrity Attack
- **CAPEC-185**: Malicious Software Download - Download de software malicioso
- **CAPEC-186**: Malicious Software Update - Atualização maliciosa
- **CAPEC-187**: Malicious Automated Software Update via Redirection - Atualização via redirecionamento
- **CAPEC-533**: Malicious Manual Software Update - Atualização manual maliciosa
- **CAPEC-657**: Malicious Automated Software Update via Spoofing - Atualização via spoofing
- **CAPEC-669**: Alteration of a Software Update - Alteração de atualização

#### CAPEC-438: Modification During Manufacture
- **CAPEC-444**: Development Alteration - Alteração no desenvolvimento
- **CAPEC-206**: Signing Malicious Code - Assinatura de código malicioso
- **CAPEC-443**: Malicious Logic Inserted by Authorized Developer - Lógica maliciosa por desenvolvedor
- **CAPEC-511**: Infiltration of Software Development Environment - Infiltração em ambiente de desenvolvimento
- **CAPEC-538**: Open-Source Library Manipulation - Manipulação de biblioteca open-source

#### CAPEC-440: Hardware Integrity Attack
- **CAPEC-401**: Physically Hacking Hardware - Hack físico de hardware
- **CAPEC-534**: Malicious Hardware Update - Atualização maliciosa de hardware
- **CAPEC-531**: Hardware Component Substitution - Substituição de componente
- **CAPEC-677**: Server Functionality Compromise - Comprometimento de funcionalidade

#### CAPEC-441: Malicious Logic Insertion
- **CAPEC-442**: Infected Software - Software infectado
- **CAPEC-448**: Embed Virus into DLL - Vírus embutido em DLL
- **CAPEC-452**: Infected Hardware - Hardware infectado
- **CAPEC-638**: Altered Component Firmware - Firmware alterado
- **CAPEC-456**: Infected Memory - Memória infectada
- **CAPEC-457**: USB Memory Attacks - Ataques via USB
- **CAPEC-458**: Flash Memory Attacks - Ataques via flash

#### CAPEC-594: Traffic Injection
- **CAPEC-595**: Connection Reset - Reset de conexão
- **CAPEC-596**: TCP RST Injection - Injeção TCP RST

#### CAPEC-624: Hardware Fault Injection
- **CAPEC-625**: Mobile Device Fault Injection - Injeção de falha em dispositivo móvel

---

## 3. Repudiation (Repúdio)

Ameaças relacionadas à negação de ações realizadas ou falta de auditoria adequada.

### CAPECs Principais:

#### CAPEC-268: Audit Log Manipulation
- **CAPEC-93**: Log Injection-Tampering-Forging - Injeção/adulteração/falsificação de logs
- **CAPEC-81**: Web Logs Tampering - Adulteração de logs web

#### CAPEC-571: Block Logging to Central Repository
Bloqueio de registro de logs em repositório central

#### CAPEC-67: String Format Overflow in syslog()
Overflow de formato de string em syslog

#### CAPEC-195: Principal Spoof
- **CAPEC-587**: Cross Frame Scripting (XFS) - Script entre frames para negar origem
- **CAPEC-599**: Terrestrial Jamming - Jamming para ocultar ações

---

## 4. Information Disclosure (Divulgação de Informações)

Ameaças relacionadas ao acesso não autorizado ou vazamento de informações sensíveis.

### CAPECs Principais:

#### CAPEC-129: Pointer Manipulation
Manipulação de ponteiros para acessar informações sensíveis

#### CAPEC-212: Functionality Misuse
- **CAPEC-48**: Passing Local Filenames to Functions That Expect a URL - Passagem de nomes de arquivo local
- **CAPEC-111**: JSON Hijacking (aka JavaScript Hijacking) - Sequestro JSON/JavaScript
- **CAPEC-620**: Drop Encryption Level - Redução de nível de criptografia
- **CAPEC-606**: Weakening of Cellular Encryption - Enfraquecimento de criptografia celular

#### CAPEC-216: Communication Channel Manipulation
- **CAPEC-12**: Choosing Message Identifier - Escolha de identificador de mensagem
- **CAPEC-217**: Exploiting Incorrectly Configured SSL - Exploração de SSL mal configurado

#### CAPEC-554: Functionality Bypass
- **CAPEC-179**: Calling Micro-Services Directly - Chamada direta de microserviços
- **CAPEC-464**: Evercookie - Cookies persistentes
- **CAPEC-465**: Transparent Proxy Abuse - Abuso de proxy transparente

#### CAPEC-117: Interception
- **CAPEC-157**: Sniffing Attacks - Ataques de sniffing
- **CAPEC-57**: Utilising REST's Trust in System Resources - Exploração de confiança REST
- **CAPEC-65**: Sniff Application Code - Sniffing de código
- **CAPEC-158**: Sniffing Network Traffic - Sniffing de tráfego
- **CAPEC-609**: Cellular Traffic Intercept - Interceptação de tráfego celular
- **CAPEC-499**: Android Intent Intercept - Interceptação de Intent Android
- **CAPEC-651**: Eavesdropping - Escuta clandestina
- **CAPEC-508**: Shoulder Surfing - Olhar por cima do ombro
- **CAPEC-634**: Probe Audio and Video Peripherals - Sondagem de periféricos

#### CAPEC-116: Excavation
- **CAPEC-54**: Query System for Information - Consulta de sistema
- **CAPEC-127**: Directory Indexing - Indexação de diretório
- **CAPEC-95**: WSDL Scanning - Escaneamento WSDL
- **CAPEC-215**: Fuzzing for Application Mapping - Fuzzing para mapeamento
- **CAPEC-261**: Fuzzing for Garnering Adjacent User Data - Fuzzing para dados adjacentes
- **CAPEC-150**: Collect Data From Common Resource Locations - Coleta de locais comuns
- **CAPEC-143**: Detect Unpublicised Web Pages - Detecção de páginas não publicadas
- **CAPEC-155**: Screen Temporary Files for Sensitive Information - Verificação de arquivos temporários
- **CAPEC-406**: Dumpster Diving - Mergulho em lixo
- **CAPEC-637**: Collect Data from Clipboard - Coleta de área de transferência
- **CAPEC-647**: Collect Data from Registries - Coleta de registros
- **CAPEC-648**: Collect Data from Screen Capture - Coleta de captura de tela
- **CAPEC-568**: Capture Credentials via Keylogger - Captura via keylogger
- **CAPEC-675**: Retrieve Data from Decommissioned Devices - Recuperação de dispositivos descomissionados

#### CAPEC-169: Footprinting
- **CAPEC-292**: Host Discovery - Descoberta de hosts
- **CAPEC-285**: ICMP Echo Request Ping - Ping ICMP
- **CAPEC-287**: TCP SYN Scan - Escaneamento TCP SYN
- **CAPEC-300**: Port Scanning - Escaneamento de portas
- **CAPEC-301**: TCP Connect Scan - Escaneamento TCP Connect
- **CAPEC-302**: TCP FIN Scan - Escaneamento TCP FIN
- **CAPEC-303**: TCP Xmas Scan - Escaneamento TCP Xmas
- **CAPEC-304**: TCP Null Scan - Escaneamento TCP Null
- **CAPEC-308**: UDP Scan - Escaneamento UDP
- **CAPEC-309**: Network Topology Mapping - Mapeamento de topologia
- **CAPEC-290**: Enumerate Mail Exchange Records - Enumeração de registros MX
- **CAPEC-291**: DNS Zone Transfers - Transferência de zona DNS
- **CAPEC-293**: Traceroute Route Enumeration - Enumeração via traceroute
- **CAPEC-573**: Process Footprinting - Footprinting de processos
- **CAPEC-574**: Services Footprinting - Footprinting de serviços
- **CAPEC-575**: Account Footprinting - Footprinting de contas
- **CAPEC-580**: System Footprinting - Footprinting de sistema
- **CAPEC-85**: AJAX Footprinting - Footprinting AJAX
- **CAPEC-646**: Peripheral Footprinting - Footprinting de periféricos

#### CAPEC-224: Fingerprinting
- **CAPEC-312**: Active OS Fingerprinting - Fingerprinting ativo de SO
- **CAPEC-313**: Passive OS Fingerprinting - Fingerprinting passivo de SO
- **CAPEC-541**: Application Fingerprinting - Fingerprinting de aplicação
- **CAPEC-170**: Web Application Fingerprinting - Fingerprinting de app web
- **CAPEC-310**: Scanning for Vulnerable Software - Escaneamento de software vulnerável
- **CAPEC-472**: Browser Fingerprinting - Fingerprinting de navegador

#### CAPEC-192: Protocol Analysis
- **CAPEC-97**: Cryptanalysis - Criptoanálise
- **CAPEC-463**: Padding Oracle Crypto Attack - Ataque padding oracle
- **CAPEC-608**: Cryptanalysis of Cellular Encryption - Criptoanálise celular

#### CAPEC-188: Reverse Engineering
- **CAPEC-167**: White Box Reverse Engineering - Engenharia reversa white box
- **CAPEC-37**: Retrieve Embedded Sensitive Information - Recuperação de informações embutidas
- **CAPEC-190**: Reverse Engineer Executable - Engenharia reversa de executável
- **CAPEC-191**: Read Sensitive Constants Within Executable - Leitura de constantes sensíveis
- **CAPEC-204**: Lifting Sensitive Data Embedded in Cache - Extração de cache
- **CAPEC-189**: Black Box Reverse Engineering - Engenharia reversa black box
- **CAPEC-621**: Analysis of Packet Timing and Sizes - Análise de timing de pacotes
- **CAPEC-622**: Electromagnetic Side-Channel Attack - Ataque de canal lateral eletromagnético

#### CAPEC-410: Information Elicitation
- **CAPEC-407**: Pretexting - Pretexto para obter informações
- **CAPEC-383**: Harvesting Information via API Event Monitoring - Coleta via monitoramento de API

---

## 5. Denial of Service (Negação de Serviço)

Ameaças relacionadas à indisponibilidade de sistemas, serviços ou recursos.

### CAPECs Principais:

#### CAPEC-125: Flooding
- **CAPEC-482**: TCP Flood - Inundação TCP
- **CAPEC-486**: UDP Flood - Inundação UDP
- **CAPEC-487**: ICMP Flood - Inundação ICMP
- **CAPEC-488**: HTTP Flood - Inundação HTTP
- **CAPEC-489**: SSL Flood - Inundação SSL
- **CAPEC-490**: Amplification - Amplificação
- **CAPEC-528**: XML Flood - Inundação XML
- **CAPEC-147**: XML Ping of the Death - Ping da morte XML
- **CAPEC-666**: BlueSmacking - Ataque BlueSmack

#### CAPEC-130: Excessive Allocation
- **CAPEC-230**: Serialized Data with Nested Payloads - Dados serializados aninhados
- **CAPEC-197**: Exponential Data Expansion - Expansão exponencial de dados
- **CAPEC-491**: Quadratic Data Expansion - Expansão quadrática de dados
- **CAPEC-231**: Oversized Serialized Data Payloads - Payloads serializados grandes
- **CAPEC-201**: Serialized Data External Linking - Linking externo de dados serializados
- **CAPEC-229**: Serialized Data Parameter Blowup - Explosão de parâmetro serializado
- **CAPEC-492**: Regular Expression Exponential Blowup - Explosão exponencial de regex
- **CAPEC-493**: SOAP Array Blowup - Explosão de array SOAP
- **CAPEC-494**: TCP Fragmentation - Fragmentação TCP
- **CAPEC-495**: UDP Fragmentation - Fragmentação UDP
- **CAPEC-496**: ICMP Fragmentation - Fragmentação ICMP

#### CAPEC-131: Resource Leak Exposure
Exposição de vazamento de recursos

#### CAPEC-227: Sustained Client Engagement
- **CAPEC-469**: HTTP DoS - DoS HTTP

#### CAPEC-25: Forced Deadlock
Deadlock forçado para travar sistema

#### CAPEC-607: Obstruction
- **CAPEC-547**: Physical Destruction of Device or Component - Destruição física
- **CAPEC-582**: Route Disabling - Desabilitação de rota
- **CAPEC-583**: Disabling Network Hardware - Desabilitação de hardware de rede
- **CAPEC-584**: BGP Route Disabling - Desabilitação de rota BGP
- **CAPEC-585**: DNS Domain Seizure - Apreensão de domínio DNS
- **CAPEC-601**: Jamming - Interferência
- **CAPEC-559**: Orbital Jamming - Jamming orbital
- **CAPEC-604**: Wi-Fi Jamming - Jamming Wi-Fi
- **CAPEC-605**: Cellular Jamming - Jamming celular
- **CAPEC-603**: Blockage - Bloqueio
- **CAPEC-589**: DNS Blocking - Bloqueio DNS
- **CAPEC-590**: IP Address Blocking - Bloqueio de IP
- **CAPEC-96**: Block Access to Libraries - Bloqueio de acesso a bibliotecas

#### CAPEC-2: Inducing Account Lockout
Indução de bloqueio de conta

---

## 6. Elevation of Privilege (Elevação de Privilégio)

Ameaças relacionadas à obtenção não autorizada de privilégios elevados ou acesso administrativo.

### CAPECs Principais:

#### CAPEC-5: Blue Boxing
Exploração de vulnerabilidades para elevar privilégios

#### CAPEC-21: Exploitation of Trusted Identifiers
- **CAPEC-196**: Session Credential Falsification through Forging - Falsificação de credenciais por forjamento
- **CAPEC-226**: Session Credential Falsification through Manipulation - Falsificação por manipulação
- **CAPEC-59**: Session Credential Falsification through Prediction - Falsificação por previsão
- **CAPEC-510**: SaaS User Request Forgery - Falsificação de requisição SaaS
- **CAPEC-593**: Session Hijacking - Sequestro de sessão
- **CAPEC-102**: Session Sidejacking - Sidejacking de sessão
- **CAPEC-107**: Cross Site Tracing - Rastreamento cross-site
- **CAPEC-60**: Reusing Session IDs (Session Replay) - Reutilização de IDs de sessão
- **CAPEC-61**: Session Fixation - Fixação de sessão
- **CAPEC-62**: Cross Site Request Forgery - Falsificação de requisição cross-site
- **CAPEC-467**: Cross Site Identification - Identificação cross-site

#### CAPEC-114: Authentication Abuse
- **CAPEC-629**: Unauthorized Use of Device Resources - Uso não autorizado de recursos
- **CAPEC-90**: Reflection Attack in Authentication Protocol - Ataque de reflexão

#### CAPEC-115: Authentication Bypass
- **CAPEC-461**: Web Services API Signature Forgery - Falsificação de assinatura de API
- **CAPEC-480**: Escaping Virtualization - Escape de virtualização
- **CAPEC-237**: Escaping a Sandbox by Calling Code in Another Language - Escape de sandbox
- **CAPEC-664**: Server Side Request Forgery - Falsificação de requisição server-side
- **CAPEC-668**: Key Negotiation of Bluetooth Attack (KNOB) - Ataque KNOB
- **CAPEC-87**: Forceful Browsing - Navegação forçada

#### CAPEC-22: Exploiting Trust in Client
- **CAPEC-202**: Create Malicious Client - Criação de cliente malicioso
- **CAPEC-207**: Removing Important Client Functionality - Remoção de funcionalidade
- **CAPEC-200**: Removal of Filters - Remoção de filtros
- **CAPEC-39**: Manipulating Opaque Client-based Data Tokens - Manipulação de tokens
- **CAPEC-31**: Accessing/Intercepting/Modifying HTTP Cookies - Manipulação de cookies
- **CAPEC-77**: Manipulating User-Controlled Variables - Manipulação de variáveis
- **CAPEC-13**: Subverting Environment Variable Values - Subversão de variáveis de ambiente
- **CAPEC-162**: Manipulating Hidden Fields - Manipulação de campos ocultos

#### CAPEC-94: Adversary in the Middle (AiTM)
- **CAPEC-219**: XML Routing Detour Attacks - Ataque de desvio de roteamento XML
- **CAPEC-384**: Application API Message Manipulation via MitM - Manipulação de mensagem via MitM
- **CAPEC-385**: Transaction Tampering via API Manipulation - Adulteração de transação
- **CAPEC-389**: Content Spoofing Via API Manipulation - Falsificação via API
- **CAPEC-386**: Application API Navigation Remapping - Remapeamento de navegação
- **CAPEC-388**: Application API Button Hijacking - Sequestro de botão
- **CAPEC-466**: Leveraging Active MitM to Bypass Same Origin Policy - Bypass de Same Origin
- **CAPEC-662**: Adversary in the Browser (AiTB) - Adversário no navegador

#### CAPEC-122: Privilege Abuse
- **CAPEC-1**: Accessing Functionality Not Properly Constrained by ACLs - Acesso a funcionalidade sem ACL
- **CAPEC-58**: Restful Privilege Elevation - Elevação via REST
- **CAPEC-679**: Exploitation of Improperly Configured Memory Protections - Exploração de proteção de memória
- **CAPEC-36**: Using Unpublished Interfaces - Uso de interfaces não publicadas
- **CAPEC-121**: Exploit Non-Production Interfaces - Exploração de interfaces não-produção
- **CAPEC-17**: Using Malicious Files - Uso de arquivos maliciosos
- **CAPEC-177**: Create Files with Same Name as Protected Files - Criação de arquivos com mesmo nome
- **CAPEC-263**: Force Use of Corrupted Files - Forçar uso de arquivos corrompidos
- **CAPEC-562**: Modify Shared File - Modificação de arquivo compartilhado
- **CAPEC-563**: Add Malicious File to Shared Webroot - Adição de arquivo malicioso
- **CAPEC-642**: Replace Binaries - Substituição de binários
- **CAPEC-650**: Upload a Web Shell to a Web Server - Upload de web shell
- **CAPEC-35**: Leveraging Executable Code in Non-Executable Files - Código executável em arquivos não-executáveis
- **CAPEC-180**: Exploiting Incorrectly Configured Access Control - Exploração de controle de acesso mal configurado
- **CAPEC-503**: WebView Exposure - Exposição de WebView

#### CAPEC-233: Privilege Escalation
- **CAPEC-104**: Cross Zone Scripting - Script cross-zone
- **CAPEC-234**: Hijacking a Privileged Process - Sequestro de processo privilegiado
- **CAPEC-30**: Hijacking a Privileged Thread of Execution - Sequestro de thread privilegiada
- **CAPEC-68**: Subvert Code-signing Facilities - Subversão de assinatura de código
- **CAPEC-69**: Target Programs with Elevated Privileges - Programas com privilégios elevados

#### CAPEC-390: Bypassing Physical Security
- **CAPEC-391**: Bypassing Physical Locks - Bypass de fechaduras físicas
- **CAPEC-392**: Lock Bumping - Bumping de fechadura
- **CAPEC-393**: Lock Picking - Gazua
- **CAPEC-395**: Bypassing Electronic Locks - Bypass de fechaduras eletrônicas
- **CAPEC-397**: Cloning Magnetic Strip Cards - Clonagem de cartões magnéticos
- **CAPEC-399**: Cloning RFID Cards or Chips - Clonagem de RFID
- **CAPEC-626**: Smudge Attack - Ataque de manchas

#### CAPEC-507: Physical Theft
Roubo físico de dispositivos ou componentes

#### CAPEC-560: Use of Known Domain Credentials
- **CAPEC-555**: Remote Services with Stolen Credentials - Serviços remotos com credenciais roubadas
- **CAPEC-600**: Credential Stuffing - Preenchimento de credenciais
- **CAPEC-652**: Use of Known Kerberos Credentials - Uso de credenciais Kerberos conhecidas
- **CAPEC-509**: Kerberoasting - Ataque Kerberoasting
- **CAPEC-645**: Use of Captured Tickets (Pass The Ticket) - Uso de tickets capturados
- **CAPEC-653**: Use of Known Windows Credentials - Uso de credenciais Windows conhecidas
- **CAPEC-561**: Windows Admin Shares with Stolen Credentials - Compartilhamentos Admin com credenciais roubadas
- **CAPEC-644**: Use of Captured Hashes (Pass The Hash) - Uso de hashes capturados

#### Password Abuse
- **CAPEC-50**: Password Recovery Exploitation - Exploração de recuperação de senha
- **CAPEC-16**: Dictionary Based Password Attack - Ataque de dicionário
- **CAPEC-49**: Password Brute Forcing - Força bruta de senha
- **CAPEC-565**: Password Spraying - Pulverização de senha
- **CAPEC-70**: Try Common or Default Usernames and Passwords - Tentativa de credenciais padrão
- **CAPEC-55**: Rainbow Table Password Cracking - Quebra via rainbow table

#### Encryption Abuse
- **CAPEC-112**: Brute Force - Força bruta
- **CAPEC-20**: Encryption Brute Forcing - Força bruta de criptografia

#### CAPEC-549: Local Code Execution
- **CAPEC-542**: Targeted Malware - Malware direcionado
- **CAPEC-550**: Install New Service - Instalação de novo serviço
- **CAPEC-551**: Modify Existing Service - Modificação de serviço existente
- **CAPEC-552**: Install Rootkit - Instalação de rootkit
- **CAPEC-556**: Replace File Extension Handlers - Substituição de handlers de extensão
- **CAPEC-558**: Replace Trusted Executable - Substituição de executável confiável
- **CAPEC-564**: Run Software at Login - Execução de software no login

#### CAPEC-248: Command Injection
- **CAPEC-136**: LDAP Injection - Injeção LDAP
- **CAPEC-66**: SQL Injection - Injeção SQL
- **CAPEC-7**: Blind SQL Injection - Injeção SQL cega
- **CAPEC-109**: Object Relational Mapping Injection - Injeção ORM
- **CAPEC-110**: SQL Injection through SOAP Parameter Tampering - Injeção SQL via SOAP
- **CAPEC-108**: Command Line Execution through SQL Injection - Execução de linha de comando via SQL
- **CAPEC-470**: Expanding Control over OS from Database - Expansão de controle via banco
- **CAPEC-88**: OS Command Injection - Injeção de comando do SO
- **CAPEC-183**: IMAP/SMTP Command Injection - Injeção de comando IMAP/SMTP
- **CAPEC-250**: XML Injection - Injeção XML
- **CAPEC-83**: XPath Injection - Injeção XPath
- **CAPEC-84**: XQuery Injection - Injeção XQuery
- **CAPEC-228**: DTD Injection - Injeção DTD
- **CAPEC-676**: NoSQL Injection - Injeção NoSQL
- **CAPEC-40**: Manipulating Writeable Terminal Devices - Manipulação de dispositivos de terminal
- **CAPEC-137**: Parameter Injection - Injeção de parâmetro
- **CAPEC-6**: Argument Injection - Injeção de argumento
- **CAPEC-15**: Command Delimiters - Delimitadores de comando
- **CAPEC-460**: HTTP Parameter Pollution (HPP) - Poluição de parâmetro HTTP
- **CAPEC-134**: Email Injection - Injeção de email
- **CAPEC-135**: Format String Injection - Injeção de format string
- **CAPEC-175**: Code Inclusion - Inclusão de código
- **CAPEC-251**: Local Code Inclusion - Inclusão local de código
- **CAPEC-252**: PHP Local File Inclusion - Inclusão local de arquivo PHP
- **CAPEC-640**: Inclusion of Code in Existing Process - Inclusão de código em processo existente
- **CAPEC-253**: Remote Code Inclusion - Inclusão remota de código
- **CAPEC-101**: Server Side Include (SSI) Injection - Injeção SSI
- **CAPEC-193**: PHP Remote File Inclusion - Inclusão remota de arquivo PHP
- **CAPEC-500**: WebView Injection - Injeção WebView

#### CAPEC-242: Code Injection
- **CAPEC-19**: Embedding Scripts within Scripts - Embutir scripts dentro de scripts
- **CAPEC-23**: File Content Injection - Injeção de conteúdo de arquivo
- **CAPEC-41**: Using Meta-Characters in E-mail Headers - Meta-caracteres em headers de email
- **CAPEC-63**: Cross-site Scripting (XSS) - XSS
- **CAPEC-588**: DOM-Based XSS - XSS baseado em DOM
- **CAPEC-591**: Reflected XSS - XSS refletido
- **CAPEC-592**: Stored XSS - XSS armazenado
- **CAPEC-18**: XSS Through Non-Script Elements - XSS via elementos não-script
- **CAPEC-32**: XSS Through HTTP Query String - XSS via query string
- **CAPEC-86**: XSS Through HTTP Headers - XSS via headers HTTP
- **CAPEC-198**: XSS Targeting Error Pages - XSS em páginas de erro
- **CAPEC-199**: XSS Using Alternate Syntax - XSS com sintaxe alternativa
- **CAPEC-243**: XSS Targeting HTML Attributes - XSS em atributos HTML
- **CAPEC-468**: Generic Cross-Browser Cross-Domain Theft - Roubo cross-browser cross-domain

#### CAPEC-240: Resource Injection
- **CAPEC-610**: Cellular Data Injection - Injeção de dados celulares

#### CAPEC-586: Object Injection
Injeção de objeto malicioso

---

## Resumo por Categoria

| Categoria STRIDE | Total CAPECs | Principais Padrões |
|-----------------|--------------|-------------------|
| **Spoofing** | 60+ | Identity Spoofing, Phishing, Content Spoofing, Resource Location Spoofing |
| **Tampering** | 80+ | Buffer Manipulation, Protocol Manipulation, Software Integrity Attack |
| **Repudiation** | 10+ | Audit Log Manipulation, Block Logging |
| **Information Disclosure** | 100+ | Interception, Footprinting, Fingerprinting, Reverse Engineering |
| **Denial of Service** | 40+ | Flooding, Excessive Allocation, Obstruction, Resource Leak |
| **Elevation of Privilege** | 120+ | Authentication Bypass, Privilege Abuse, Command Injection, Code Injection |

---

## Instruções de Uso para Threat Modeling

### 1. Para Análise de Ameaças:
- Identifique componentes do sistema
- Para cada componente, avalie ameaças de **TODAS as 6 categorias STRIDE**
- Use os CAPECs como referência de padrões de ataque conhecidos
- Priorize com base em impacto e probabilidade

### 2. Para Geração de Relatórios:
- **OBRIGATÓRIO**: Incluir ameaças de TODAS as 6 categorias
- **OBRIGATÓRIO**: Gerar no mínimo 2-3 ameaças por componente
- **OBRIGATÓRIO**: Usar apenas CAPECs deste mapeamento
- **OBRIGATÓRIO**: Fornecer mitigações específicas

### 3. Validação:
✅ Spoofing: Presente  
✅ Tampering: Presente  
✅ Repudiation: Presente  
✅ Information Disclosure: Presente  
✅ Denial of Service: Presente  
✅ Elevation of Privilege: Presente  

**Total: 6/6 categorias STRIDE completas**

---

## Metadados

- **Fonte**: MITRE CAPEC Database
- **URL**: https://capec.mitre.org/data/definitions/1000.html
- **Versão**: Outubro 2025
- **Total de CAPECs Mapeados**: 400+
- **Licença**: Creative Commons Attribution-NoDerivatives 4.0 International License
- **Compilado por**: Brett Crawley / MITRE Corporation

---

## LICENÇA

### MITRE CAPEC License
The MITRE Corporation (MITRE) hereby grants you a non-exclusive, royalty-free license to use Common Attack Pattern Enumeration and Classification (CAPEC™) for research, development, and commercial purposes. Any copy you make for such purposes is authorized provided that you reproduce MITRE's copyright designation and this license in any such copy.

### DISCLAIMERS
ALL DOCUMENTS AND THE INFORMATION CONTAINED THEREIN ARE PROVIDED ON AN "AS IS" BASIS AND THE CONTRIBUTOR, THE ORGANIZATION HE/SHE REPRESENTS OR IS SPONSORED BY (IF ANY), THE MITRE CORPORATION, ITS BOARD OF TRUSTEES, OFFICERS, AGENTS, AND EMPLOYEES, DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTY THAT THE USE OF THE INFORMATION THEREIN WILL NOT INFRINGE ANY RIGHTS OR ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.

### Creative Commons
This work is licensed under a Creative Commons Attribution-NoDerivatives 4.0 International License.
https://creativecommons.org/licenses/by-nd/4.0/
