import type { Lang, PageKey } from "./pages";

type FAQ = { q: string; a: string };
type Section = { h: string; p: string[] };
export type PageContent = { title: string; description: string; h1: string; lead: string; nav?: string; sections: Section[]; faq?: FAQ[] };

const CONTACT = "hello@savora.app";

const en = {
  ui: {
    tagline: "Download. Save. Enjoy.",
    placeholder: "Paste an Instagram link — post, reel, story…",
    paste: "Paste",
    download: "Download",
    loading: "Fetching media…",
    downloaders: "Downloaders",
    company: "Company",
    legal: "Legal",
    language: "Language",
    offline: "You're offline. Downloads need an internet connection.",
    disclaimer: "SAVORA is an independent service and is not affiliated with, endorsed or sponsored by Instagram or Meta Platforms, Inc.",
    respect: "Only download content you own or have permission to use.",
    rights: "All rights reserved.",
    faqTitle: "Frequently asked questions",
    stepsTitle: "How it works",
    steps: [
      { h: "Copy the link", p: "Open Instagram, tap ··· or Share on the post, reel or story and choose Copy link." },
      { h: "Paste it here", p: "Drop the link into the field above. SAVORA detects the content type automatically." },
      { h: "Save the file", p: "Pick the quality you want and download the original file straight to your device." },
    ],
    featuresTitle: "Built for speed and respect",
    features: [
      { h: "Original quality", p: "We fetch the highest resolution Instagram makes available, without re-compressing." },
      { h: "No account needed", p: "No sign-up, no Instagram login. Your password never touches SAVORA." },
      { h: "Works everywhere", p: "Phone, tablet or desktop — any modern browser. Install it as an app in one tap." },
      { h: "Private by design", p: "We don't store your links or the files you download." },
    ],
    categoriesTitle: "What you can download",
    result: { item: "Item", video: "Video", image: "Photo", by: "by", all: "Download all" },
    errors: {
      invalid_url: "That doesn't look like an Instagram post, reel, story or highlight link.",
      unsupported: "This type of content isn't supported yet.",
      private: "This content is from a private account and can't be downloaded.",
      not_found: "We couldn't find this content. It may have been deleted.",
      not_configured: "The download service is temporarily unavailable. Please try again later.",
      rate_limited: "Too many requests. Please wait a minute and try again.",
      upstream: "Something went wrong while fetching this content. Please try again.",
    },
  },
  home: {
    title: "SAVORA — Instagram Downloader for Videos, Reels, Photos & Stories",
    description: "Download Instagram videos, Reels, photos, Stories, Highlights and carousels in original HD quality. Free, fast, no login required.",
    h1: "Instagram Downloader",
    lead: "Save Instagram videos, Reels, photos and Stories in their original quality. Paste a link — we handle the rest.",
    sections: [
      { h: "A cleaner way to save Instagram media", p: [
        "SAVORA is an online Instagram downloader made for people who keep references, archive their own work or want to watch a Reel later without signal. Paste any public link and SAVORA reads what's inside: a single photo, a video, a Reel, a Story, a Highlight or a carousel with mixed media.",
        "Every file is delivered as it was uploaded. When Instagram offers several resolutions, you choose. Nothing is watermarked and nothing is re-encoded.",
      ] },
      { h: "Download Instagram photos in HD", p: [
        "Photos and carousel images are saved as full-resolution JPG files. Carousels are split into individual items so you can keep just the ones you need, or save them all at once.",
      ] },
      { h: "Use it responsibly", p: [
        "Content on Instagram belongs to its creators. Use SAVORA for your own posts, for content you have permission to reuse, or for personal offline viewing. Private accounts stay private: SAVORA cannot and will not access them.",
      ] },
    ],
    faq: [
      { q: "Is SAVORA free?", a: "Yes. SAVORA is free to use, with a fair-use limit to keep the service fast for everyone." },
      { q: "Do I need an Instagram account?", a: "No. You never log in and we never ask for your Instagram credentials." },
      { q: "Can I download from private accounts?", a: "No. SAVORA only works with publicly available content and respects private-account restrictions." },
      { q: "Where are files saved?", a: "In your browser's default download folder — usually Downloads on desktop, or Files/Gallery on mobile." },
      { q: "Does it work on iPhone and Android?", a: "Yes. SAVORA works in Safari, Chrome and other modern browsers, and can be installed on your home screen." },
      { q: "Is SAVORA affiliated with Instagram?", a: "No. SAVORA is an independent tool and is not affiliated with Instagram or Meta." },
    ],
  } satisfies PageContent,
  pages: {
    video: { nav: "Video", title: "Instagram Video Downloader — Download Instagram Videos in HD | SAVORA", description: "Download Instagram videos in HD as MP4. Paste the link, choose quality, save. Free and no login.", h1: "Instagram Video Downloader", lead: "Download Instagram videos as MP4 files in the best quality available.", sections: [
      { h: "Save any public Instagram video", p: ["Feed videos, IGTV and clips shared in posts are saved as MP4 with the original audio track. When several resolutions exist, SAVORA lists them so you can trade quality for file size."] },
      { h: "Why MP4", p: ["MP4 plays on every phone, laptop and editor without conversion, so your downloads are ready to use straight away."] },
    ], faq: [{ q: "What format are videos saved in?", a: "MP4 (H.264), the format Instagram itself serves." }, { q: "Is there a length limit?", a: "No limit from our side; very long videos simply take longer to download." }] },
    photo: { nav: "Photo", title: "Instagram Photo Downloader — Download Instagram Photos in HD | SAVORA", description: "Download Instagram photos in full HD resolution. Single posts and carousels, free and fast.", h1: "Instagram Photo Downloader", lead: "Download Instagram photos in HD — the full resolution, not a screenshot.", sections: [
      { h: "Full resolution, every time", p: ["Screenshots crop and compress. SAVORA fetches the original JPG at the largest size Instagram stores, up to 1080px wide and beyond for newer uploads."] },
    ], faq: [{ q: "Can I download profile pictures?", a: "Not yet — SAVORA currently supports posts, Reels, Stories and Highlights." }] },
    reels: { nav: "Reels", title: "Instagram Reels Downloader — Download Reels in HD | SAVORA", description: "Download Instagram Reels in HD with sound. Paste the Reel link and save it as MP4 in seconds.", h1: "Instagram Reels Downloader", lead: "Save Instagram Reels with their original sound, ready to watch offline.", sections: [
      { h: "Reels, offline", p: ["Copy the Reel link from the Share menu, paste it into SAVORA, and get an MP4 you can watch on a flight or keep as reference for your next edit."] },
    ], faq: [{ q: "Are Reels saved with audio?", a: "Yes, Reels keep their original audio track." }] },
    story: { nav: "Stories", title: "Instagram Story Downloader — Save Instagram Stories | SAVORA", description: "Download Instagram Stories from public accounts as photos or videos before they disappear.", h1: "Instagram Story Downloader", lead: "Keep public Instagram Stories before the 24 hours are up.", sections: [
      { h: "How to get a Story link", p: ["Open the Story, tap ··· or the share icon and choose Copy link. Each Story frame has its own link; SAVORA returns the photo or video for that frame."] },
    ], faq: [{ q: "Will the account know I downloaded their Story?", a: "SAVORA doesn't use your account, but Instagram may still count views depending on how the content is served." }] },
    highlights: { nav: "Highlights", title: "Instagram Highlights Downloader — Download Story Highlights | SAVORA", description: "Download Instagram Story Highlights from public profiles. All items in a highlight, in original quality.", h1: "Instagram Highlights Downloader", lead: "Download every photo and video saved in a public Instagram Highlight.", sections: [
      { h: "All items, one link", p: ["Paste the link to a Highlight and SAVORA lists every item inside it. Download them one by one or all together."] },
    ], faq: [{ q: "Where do I find a Highlight link?", a: "Open the Highlight from the profile, tap ··· and choose Copy link." }] },
    carousel: { nav: "Carousel", title: "Instagram Carousel Downloader — Download Multiple Photos & Videos | SAVORA", description: "Download every photo and video from an Instagram carousel post at once, in HD.", h1: "Instagram Carousel Downloader", lead: "Get every slide of a carousel — photos and videos — in one go.", sections: [
      { h: "Mixed media, handled", p: ["Carousels can mix up to 20 photos and videos. SAVORA keeps them in order and labels each one so you know exactly what you're saving."] },
    ], faq: [{ q: "Can I pick just one slide?", a: "Yes. Every slide has its own download button, plus a Download all option." }] },
    about: { nav: "About", title: "About SAVORA — Independent Instagram Downloader", description: "Who we are and how SAVORA works: an independent, privacy-first Instagram media downloader.", h1: "About SAVORA", lead: "A small, independent tool for saving Instagram media the right way.", sections: [
      { h: "What we do", p: ["SAVORA turns public Instagram links into downloadable files. We focus on three things: original quality, a clean interface with no dark patterns, and respect for creators and privacy."] },
      { h: "Independence", p: ["SAVORA is not affiliated with, endorsed or sponsored by Instagram or Meta Platforms, Inc. Instagram is a trademark of Meta Platforms, Inc."] },
    ] },
    contact: { nav: "Contact", title: "Contact SAVORA", description: "Get in touch with the SAVORA team for support, partnerships or copyright requests.", h1: "Contact", lead: "We read every message and usually reply within two business days.", sections: [
      { h: "Email", p: [`General questions and support: ${CONTACT}`, `Copyright and takedown requests: ${CONTACT} — subject "Takedown".`] },
    ] },
    privacy: { nav: "Privacy Policy", title: "Privacy Policy | SAVORA", description: "How SAVORA handles data: no accounts, no stored links, minimal technical logs.", h1: "Privacy Policy", lead: "Short version: we don't want your data.", sections: [
      { h: "What we collect", p: ["SAVORA does not require an account. Links you submit are processed to fetch the media and are not stored. We keep short-lived technical logs (such as IP address and request time) to prevent abuse and enforce rate limits."] },
      { h: "Cookies and analytics", p: ["We may use privacy-friendly analytics to understand aggregate usage. We do not sell personal data."] },
      { h: "Your rights", p: [`You can contact us at ${CONTACT} for any privacy request, including access or deletion of data we may hold.`] },
    ] },
    terms: { nav: "Terms of Service", title: "Terms of Service | SAVORA", description: "The rules for using SAVORA, the independent Instagram downloader.", h1: "Terms of Service", lead: "By using SAVORA you agree to these terms.", sections: [
      { h: "Acceptable use", p: ["Use SAVORA only to download content you own, have permission to use, or for lawful personal purposes. You are responsible for how you use downloaded content."] },
      { h: "No warranty", p: ["SAVORA is provided as is. Availability depends on third-party platforms and may change without notice."] },
      { h: "Limits", p: ["We apply rate limits to protect the service and may block automated or abusive use."] },
    ] },
    copyright: { nav: "Copyright & Takedown", title: "Copyright & Takedown Policy | SAVORA", description: "How to report copyright concerns related to SAVORA.", h1: "Copyright & Takedown Policy", lead: "We respect creators' rights.", sections: [
      { h: "We don't host content", p: ["SAVORA does not store or host Instagram media. Files are fetched on request from publicly available sources and delivered directly to the user."] },
      { h: "Reporting", p: [`If you believe SAVORA is being used to infringe your copyright, email ${CONTACT} with the URL of the content, proof of ownership and your contact details. We review every report promptly and can block specific content from being processed.`] },
    ] },
  } as Record<PageKey, PageContent>,
  categories: { post: "Post", reel: "Reel", video: "Video", story: "Story", highlight: "Highlight", carousel: "Carousel" },
};

const pt: typeof en = {
  ui: {
    tagline: "Download. Save. Enjoy.",
    placeholder: "Cole um link do Instagram — post, reel, story…",
    paste: "Colar",
    download: "Baixar",
    loading: "A obter o conteúdo…",
    downloaders: "Downloaders",
    company: "Empresa",
    legal: "Legal",
    language: "Idioma",
    offline: "Está sem internet. Os downloads precisam de ligação.",
    disclaimer: "O SAVORA é um serviço independente e não é afiliado, apoiado ou patrocinado pelo Instagram ou pela Meta Platforms, Inc.",
    respect: "Baixe apenas conteúdo seu ou que tenha autorização para usar.",
    rights: "Todos os direitos reservados.",
    faqTitle: "Perguntas frequentes",
    stepsTitle: "Como funciona",
    steps: [
      { h: "Copie o link", p: "No Instagram, toque em ··· ou Partilhar no post, reel ou story e escolha Copiar link." },
      { h: "Cole aqui", p: "Coloque o link no campo acima. O SAVORA identifica o tipo de conteúdo automaticamente." },
      { h: "Guarde o ficheiro", p: "Escolha a qualidade e baixe o ficheiro original diretamente para o seu dispositivo." },
    ],
    featuresTitle: "Rápido e respeitador",
    features: [
      { h: "Qualidade original", p: "Obtemos a maior resolução que o Instagram disponibiliza, sem voltar a comprimir." },
      { h: "Sem conta", p: "Sem registo e sem login no Instagram. A sua palavra-passe nunca passa pelo SAVORA." },
      { h: "Funciona em todo o lado", p: "Telemóvel, tablet ou computador. Instale como app com um toque." },
      { h: "Privado por natureza", p: "Não guardamos os seus links nem os ficheiros que baixa." },
    ],
    categoriesTitle: "O que pode baixar",
    result: { item: "Item", video: "Vídeo", image: "Foto", by: "de", all: "Baixar tudo" },
    errors: {
      invalid_url: "Isto não parece um link de post, reel, story ou destaque do Instagram.",
      unsupported: "Este tipo de conteúdo ainda não é suportado.",
      private: "Este conteúdo é de uma conta privada e não pode ser baixado.",
      not_found: "Não encontrámos este conteúdo. Pode ter sido apagado.",
      not_configured: "O serviço de download está temporariamente indisponível. Tente mais tarde.",
      rate_limited: "Demasiados pedidos. Aguarde um minuto e tente novamente.",
      upstream: "Algo correu mal ao obter este conteúdo. Tente novamente.",
    },
  },
  home: {
    title: "SAVORA — Baixar vídeos, Reels, fotos e Stories do Instagram",
    description: "Baixe vídeos, Reels, fotos, Stories, destaques e carrosséis do Instagram em qualidade HD original. Grátis, rápido e sem login.",
    h1: "Baixar vídeos e fotos do Instagram",
    lead: "Guarde vídeos, Reels, fotos e Stories do Instagram na qualidade original. Cole o link — nós tratamos do resto.",
    sections: [
      { h: "Uma forma mais simples de guardar conteúdo do Instagram", p: [
        "O SAVORA é um downloader de Instagram online para quem guarda referências, arquiva o próprio trabalho ou quer ver um Reel mais tarde sem rede. Cole qualquer link público e o SAVORA identifica o conteúdo: uma foto, um vídeo, um Reel, um Story, um destaque ou um carrossel misto.",
        "Cada ficheiro é entregue tal como foi publicado. Quando o Instagram oferece várias resoluções, a escolha é sua. Sem marca de água e sem recodificação.",
      ] },
      { h: "Baixar fotos do Instagram em HD", p: [
        "Fotos e imagens de carrossel são guardadas como JPG em resolução total. Os carrosséis são divididos em itens individuais, para guardar só o que precisa ou tudo de uma vez.",
      ] },
      { h: "Use com responsabilidade", p: [
        "O conteúdo do Instagram pertence aos seus criadores. Use o SAVORA para as suas publicações, para conteúdo que tem autorização para reutilizar ou para ver offline. Contas privadas continuam privadas: o SAVORA não lhes acede.",
      ] },
    ],
    faq: [
      { q: "O SAVORA é grátis?", a: "Sim. É gratuito, com um limite de uso justo para manter o serviço rápido para todos." },
      { q: "Preciso de conta no Instagram?", a: "Não. Nunca faz login e nunca pedimos os seus dados do Instagram." },
      { q: "Posso baixar de contas privadas?", a: "Não. O SAVORA só funciona com conteúdo público e respeita as restrições de contas privadas." },
      { q: "Onde ficam os ficheiros?", a: "Na pasta de downloads do navegador — normalmente Transferências no computador, ou Ficheiros/Galeria no telemóvel." },
      { q: "Funciona em iPhone e Android?", a: "Sim. Funciona no Safari, Chrome e outros navegadores modernos, e pode ser instalado no ecrã inicial." },
      { q: "O SAVORA é do Instagram?", a: "Não. O SAVORA é uma ferramenta independente, sem ligação ao Instagram ou à Meta." },
    ],
  },
  pages: {
    video: { nav: "Vídeo", title: "Baixar vídeos do Instagram em HD | SAVORA", description: "Baixe vídeos do Instagram em HD no formato MP4. Cole o link, escolha a qualidade e guarde. Grátis e sem login.", h1: "Baixar vídeos do Instagram", lead: "Baixe vídeos do Instagram em MP4 na melhor qualidade disponível.", sections: [
      { h: "Guarde qualquer vídeo público", p: ["Vídeos do feed, IGTV e clips em posts são guardados em MP4 com o áudio original. Quando há várias resoluções, o SAVORA mostra-as para escolher entre qualidade e tamanho."] },
      { h: "Porquê MP4", p: ["O MP4 abre em qualquer telemóvel, computador ou editor sem conversão."] },
    ], faq: [{ q: "Em que formato ficam os vídeos?", a: "MP4 (H.264), o mesmo formato que o Instagram usa." }, { q: "Há limite de duração?", a: "Não da nossa parte; vídeos longos só demoram mais a baixar." }] },
    photo: { nav: "Fotos", title: "Baixar fotos do Instagram em HD | SAVORA", description: "Baixe fotos do Instagram em resolução HD total. Posts e carrosséis, grátis e rápido.", h1: "Baixar fotos do Instagram", lead: "Baixe fotos do Instagram em HD — a resolução completa, não uma captura de ecrã.", sections: [
      { h: "Resolução total, sempre", p: ["As capturas de ecrã cortam e comprimem. O SAVORA obtém o JPG original no maior tamanho que o Instagram guarda."] },
    ], faq: [{ q: "Posso baixar fotos de perfil?", a: "Ainda não — de momento suportamos posts, Reels, Stories e destaques." }] },
    reels: { nav: "Reels", title: "Baixar Reels do Instagram em HD | SAVORA", description: "Baixe Reels do Instagram em HD com som. Cole o link do Reel e guarde em MP4 em segundos.", h1: "Baixar Reels do Instagram", lead: "Guarde Reels do Instagram com o som original, prontos para ver offline.", sections: [
      { h: "Reels, sem rede", p: ["Copie o link do Reel no menu Partilhar, cole no SAVORA e receba um MP4 para ver num voo ou usar como referência na próxima edição."] },
    ], faq: [{ q: "Os Reels ficam com som?", a: "Sim, os Reels mantêm o áudio original." }] },
    story: { nav: "Stories", title: "Descarregar Stories do Instagram | SAVORA", description: "Descarregue Stories do Instagram de contas públicas, em foto ou vídeo, antes que desapareçam.", h1: "Descarregar Stories do Instagram", lead: "Guarde Stories públicos do Instagram antes de passarem as 24 horas.", sections: [
      { h: "Como obter o link de um Story", p: ["Abra o Story, toque em ··· ou no ícone de partilha e escolha Copiar link. Cada parte do Story tem o seu link; o SAVORA devolve a foto ou o vídeo dessa parte."] },
    ], faq: [{ q: "A conta vai saber que baixei o Story?", a: "O SAVORA não usa a sua conta, mas o Instagram pode contar visualizações conforme o conteúdo é servido." }] },
    highlights: { nav: "Destaques", title: "Baixar destaques do Instagram | SAVORA", description: "Baixe os destaques de Stories de perfis públicos do Instagram. Todos os itens, em qualidade original.", h1: "Baixar destaques do Instagram", lead: "Baixe todas as fotos e vídeos de um destaque público do Instagram.", sections: [
      { h: "Todos os itens, um só link", p: ["Cole o link do destaque e o SAVORA lista todos os itens. Baixe um a um ou todos juntos."] },
    ], faq: [{ q: "Onde encontro o link de um destaque?", a: "Abra o destaque no perfil, toque em ··· e escolha Copiar link." }] },
    carousel: { nav: "Carrossel", title: "Baixar carrossel do Instagram — várias fotos e vídeos | SAVORA", description: "Baixe todas as fotos e vídeos de um carrossel do Instagram de uma vez, em HD.", h1: "Baixar carrossel do Instagram", lead: "Obtenha todos os slides de um carrossel — fotos e vídeos — de uma vez.", sections: [
      { h: "Conteúdo misto, sem problema", p: ["Os carrosséis podem juntar até 20 fotos e vídeos. O SAVORA mantém a ordem e identifica cada um."] },
    ], faq: [{ q: "Posso escolher só um slide?", a: "Sim. Cada slide tem o seu botão, além da opção Baixar tudo." }] },
    about: { nav: "Sobre", title: "Sobre o SAVORA — downloader independente de Instagram", description: "Quem somos e como funciona o SAVORA: um downloader de Instagram independente e focado na privacidade.", h1: "Sobre o SAVORA", lead: "Uma ferramenta pequena e independente para guardar conteúdo do Instagram da forma certa.", sections: [
      { h: "O que fazemos", p: ["O SAVORA transforma links públicos do Instagram em ficheiros para baixar. Focamo-nos em três coisas: qualidade original, uma interface limpa e sem truques, e respeito pelos criadores e pela privacidade."] },
      { h: "Independência", p: ["O SAVORA não é afiliado, apoiado ou patrocinado pelo Instagram ou pela Meta Platforms, Inc. Instagram é uma marca da Meta Platforms, Inc."] },
    ] },
    contact: { nav: "Contacto", title: "Contacto | SAVORA", description: "Fale com a equipa SAVORA para suporte, parcerias ou pedidos de direitos de autor.", h1: "Contacto", lead: "Lemos todas as mensagens e respondemos normalmente em dois dias úteis.", sections: [
      { h: "Email", p: [`Dúvidas e suporte: ${CONTACT}`, `Pedidos de direitos de autor e remoção: ${CONTACT} — assunto "Remoção".`] },
    ] },
    privacy: { nav: "Política de Privacidade", title: "Política de Privacidade | SAVORA", description: "Como o SAVORA trata os dados: sem contas, sem links guardados, registos técnicos mínimos.", h1: "Política de Privacidade", lead: "Em resumo: não queremos os seus dados.", sections: [
      { h: "O que recolhemos", p: ["O SAVORA não exige conta. Os links enviados são processados para obter o conteúdo e não são guardados. Mantemos registos técnicos de curta duração (como endereço IP e hora do pedido) para evitar abusos e aplicar limites."] },
      { h: "Cookies e estatísticas", p: ["Podemos usar estatísticas que respeitam a privacidade para perceber o uso agregado. Não vendemos dados pessoais."] },
      { h: "Os seus direitos", p: [`Contacte-nos em ${CONTACT} para qualquer pedido de privacidade, incluindo acesso ou eliminação de dados.`] },
    ] },
    terms: { nav: "Termos de Serviço", title: "Termos de Serviço | SAVORA", description: "As regras de utilização do SAVORA, o downloader independente de Instagram.", h1: "Termos de Serviço", lead: "Ao usar o SAVORA aceita estes termos.", sections: [
      { h: "Uso aceitável", p: ["Use o SAVORA apenas para baixar conteúdo seu, com autorização, ou para fins pessoais legais. É responsável pela forma como usa o conteúdo baixado."] },
      { h: "Sem garantia", p: ["O SAVORA é fornecido tal como está. A disponibilidade depende de plataformas de terceiros e pode mudar sem aviso."] },
      { h: "Limites", p: ["Aplicamos limites de pedidos para proteger o serviço e podemos bloquear uso automatizado ou abusivo."] },
    ] },
    copyright: { nav: "Direitos de autor e remoção", title: "Política de direitos de autor e remoção | SAVORA", description: "Como reportar questões de direitos de autor relacionadas com o SAVORA.", h1: "Direitos de autor e remoção", lead: "Respeitamos os direitos dos criadores.", sections: [
      { h: "Não alojamos conteúdo", p: ["O SAVORA não guarda nem aloja conteúdo do Instagram. Os ficheiros são obtidos a pedido a partir de fontes públicas e entregues diretamente ao utilizador."] },
      { h: "Como reportar", p: [`Se acredita que o SAVORA está a ser usado para violar os seus direitos de autor, envie para ${CONTACT} o link do conteúdo, prova de titularidade e os seus contactos. Analisamos cada pedido rapidamente e podemos bloquear conteúdo específico.`] },
    ] },
  },
  categories: { post: "Post", reel: "Reel", video: "Vídeo", story: "Story", highlight: "Destaque", carousel: "Carrossel" },
};

export const CONTENT: Record<Lang, typeof en> = { en, pt };
export const t = (lang: Lang) => CONTENT[lang];
