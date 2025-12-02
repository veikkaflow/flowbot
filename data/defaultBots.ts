
import { Bot } from '../types.ts';
import { userAvatars, botAvatars, agentAvatars } from './avatars.ts';

// Omit<Bot, 'id' | 'ownerId'> is too restrictive for a template.
// We create a new type that includes the template-specific fields.
type BotTemplate = Omit<Bot, 'id' | 'ownerId'> & {
    id: string;
    description: string;
};

const createDefaultSchedule = () => ({
    0: { isEnabled: false, startTime: '09:00', endTime: '17:00' }, // Sunday
    1: { isEnabled: true, startTime: '09:00', endTime: '17:00' },  // Monday
    2: { isEnabled: true, startTime: '09:00', endTime: '17:00' },  // Tuesday
    3: { isEnabled: true, startTime: '09:00', endTime: '17:00' },  // Wednesday
    4: { isEnabled: true, startTime: '09:00', endTime: '17:00' },  // Thursday
    5: { isEnabled: true, startTime: '09:00', endTime: '17:00' },  // Friday
    6: { isEnabled: false, startTime: '09:00', endTime: '17:00' }, // Saturday
});

export const botTemplates: BotTemplate[] = [
    {
        id: "template_sales_b2b",
        name: "Myynti (B2B)",
        description: "Optimoitu liidien keräämiseen ja myynnin tukemiseen.",
        settings: {
            appearance: {
                brandName: "atFlow Oy",
                primaryColor: "#0ea5e9", // A slightly different blue
                headerColor: "#111827", // Darker header
                backgroundAnimation: "aurora",
                logoGallery: ['https://atflow.fi/wp-content/uploads/2023/10/logo-dark.svg'],
                brandLogo: 'https://atflow.fi/wp-content/uploads/2023/10/logo-dark.svg',
                websiteUrl: "https://atflow.fi",
                themeMode: 'light'
            },
            personality: {
                tone: "Asiantunteva",
                openingMessage: {
                    fi: "Hei! Tervetuloa. Etsitkö tekoälyratkaisuja liiketoimintasi tehostamiseen?",
                    en: ""
                },
                customInstruction: "Olet myyntiin keskittynyt tekoälyassistentti. Tavoitteesi on herättää kiinnostus, vastata alustaviin kysymyksiin ja ohjata potentiaaliset asiakkaat jättämään tarjouspyyntö tai yhteystiedot.",
                scenarios: [],
                quickReplies: [
                    { id: "qr_sales_1", text: { fi: "Pyydä demo", en: "" }, icon: 'Monitor' },
                    { id: "qr_sales_2", text: { fi: "Katso hinnoittelu", en: "" }, icon: 'Briefcase' },
                    { id: "qr_sales_3", text: { fi: "Mitä palveluita tarjoatte?", en: "" }, icon: 'HelpCircle' }
                ]
            },
            behavior: {
                askForName: false,
                askForContactInfo: "optional",
                leadGenHook: "Jos asiakas ilmaisee kiinnostuksensa palveluihin, pyydä häntä jättämään yhteystietonsa, jotta asiantuntija voi olla yhteydessä.",
                operatingMode: 'bot_then_agent',
                allowNameChange: true,
                showContactButton: true,
                showQuoteButton: true,
                language: 'fi',
            },
             // Common settings below
            schedule: {
                isAlwaysOnline: true,
                dailySchedules: createDefaultSchedule(),
                offlineMessage: "Kiitos viestistäsi! Palaamme asiaan mahdollisimman pian."
            },
            avatarSettings: {
                userAvatarGallery: userAvatars, botAvatarGallery: botAvatars, agentAvatarGallery: agentAvatars,
                selectedUserAvatar: userAvatars[0], selectedBotAvatar: botAvatars[1], selectedAgentAvatar: agentAvatars[1]
            },
            agents: [{ id: "agent_sales_1", name: "Matti Myyjä", avatar: agentAvatars[2] }],
            agentsEnabled: true,
            knowledgeBase: [],
            qnaData: [],
            userManagement: { users: [] }
        }
    },
    {
        id: "template_support_ecommerce",
        name: "Asiakaspalvelu (Verkkokauppa)",
        description: "Vastaa yleisimpiin kysymyksiin ja ohjaa asiakkaita.",
        settings: {
            appearance: {
                brandName: "Lamnia",
                primaryColor: "#e11d48", // A distinct red
                headerColor: "#ffffff",
                backgroundAnimation: "waves",
                logoGallery: ['https://www.lamnia.com/images/lamnia-logo-big.png'],
                brandLogo: 'https://www.lamnia.com/images/lamnia-logo-big.png',
                websiteUrl: "https://lamnia.com",
                themeMode: 'light'
            },
            personality: {
                tone: "Ystävällinen",
                openingMessage: {
                    fi: "Hei! Tervetuloa Lamnian asiakaspalveluun. Miten voin auttaa sinua tänään?",
                    en: ""
                },
                customInstruction: "Olet verkkokaupan ystävällinen asiakaspalvelija. Vastaa yleisiin kysymyksiin, kuten toimitusaikoihin, palautuksiin ja tuotetietoihin liittyen. Jos et tiedä vastausta, ohjaa asiakas live-agentille.",
                scenarios: [],
                quickReplies: [
                    { id: "qr_support_1", text: { fi: "Toimituskulut ja -aika?", en: "" }, icon: 'Clock' },
                    { id: "qr_support_2", text: { fi: "Miten palautan tuotteen?", en: "" }, icon: 'RefreshCcw' },
                    { id: "qr_support_3", text: { fi: "Yhteystiedot", en: "" }, icon: 'Mail' }
                ]
            },
            behavior: {
                askForName: true,
                askForContactInfo: "never",
                leadGenHook: "",
                operatingMode: 'bot_then_agent',
                allowNameChange: true,
                showContactButton: true,
                showQuoteButton: false,
                language: 'fi',
            },
            schedule: {
                isAlwaysOnline: false,
                dailySchedules: {
                    0: { isEnabled: false, startTime: "09:00", endTime: "17:00" },
                    1: { isEnabled: true, startTime: "09:00", endTime: "18:00" },
                    2: { isEnabled: true, startTime: "09:00", endTime: "18:00" },
                    3: { isEnabled: true, startTime: "09:00", endTime: "18:00" },
                    4: { isEnabled: true, startTime: "09:00", endTime: "18:00" },
                    5: { isEnabled: true, startTime: "09:00", endTime: "18:00" },
                    6: { isEnabled: true, startTime: "10:00", endTime: "15:00" },
                },
                offlineMessage: "Asiakaspalvelumme on suljettu. Palaamme asiaan seuraavana arkipäivänä."
            },
            avatarSettings: {
                userAvatarGallery: userAvatars, botAvatarGallery: botAvatars, agentAvatarGallery: agentAvatars,
                selectedUserAvatar: userAvatars[1], selectedBotAvatar: botAvatars[2], selectedAgentAvatar: agentAvatars[3]
            },
            agents: [{ id: "agent_support_1", name: "Anna Asiakaspalvelija", avatar: agentAvatars[4] }],
            agentsEnabled: true,
            knowledgeBase: [],
            qnaData: [
                { id: "qna_support_1", type: 'qna', name: "Mitkä ovat toimituskulut?", content: "Toimituskulut ovat 5,90€ kaikille tilauksille Suomeen."}
            ],
            userManagement: { users: [] }
        }
    },
    {
        id: "template_general_service",
        name: "Yleinen (Palveluyritys)",
        description: "Informaation jakamiseen ja peruskysymyksiin vastaamiseen.",
        settings: {
            appearance: {
                brandName: "Aaltovoima",
                primaryColor: "#f59e0b", // Amber/yellow
                headerColor: "#1f2937",
                backgroundAnimation: "gradient",
                logoGallery: ['https://www.aaltovoima.fi/logo.png'],
                brandLogo: 'https://www.aaltovoima.fi/logo.png',
                websiteUrl: "https://aaltovoima.fi",
                themeMode: 'dark'
            },
            personality: {
                tone: "Ammattimainen",
                openingMessage: {
                    fi: "Tervetuloa Aaltovoiman asiakaspalveluun. Miten voimme olla avuksi?",
                    en: ""
                },
                customInstruction: "Olet energiayhtiön asiallinen ja informatiivinen asiakasneuvoja. Vastaa selkeästi ja tarkasti. Jos kyse on henkilökohtaisista sopimustiedoista, ohjaa asiakas kirjautumaan Oma Aaltovoima -palveluun.",
                scenarios: [],
                quickReplies: [
                    { id: "qr_gen_1", text: { fi: "Tee sähkösopimus", en: "" }, icon: 'FileText' },
                    { id: "qr_gen_2", text: { fi: "Ilmoita sähkökatkosta", en: "" }, icon: 'AlertTriangle' },
                    { id: "qr_gen_3", text: { fi: "Laskutuskysymykset", en: "" }, icon: 'HelpCircle' }
                ]
            },
            behavior: {
                askForName: true,
                askForContactInfo: "never",
                leadGenHook: "",
                operatingMode: 'bot_only',
                allowNameChange: false,
                showContactButton: true,
                showQuoteButton: false,
                language: 'fi',
            },
            schedule: {
                isAlwaysOnline: true,
                dailySchedules: createDefaultSchedule(),
                offlineMessage: ""
            },
            avatarSettings: {
                userAvatarGallery: userAvatars, botAvatarGallery: botAvatars, agentAvatarGallery: agentAvatars,
                selectedUserAvatar: userAvatars[2], selectedBotAvatar: botAvatars[3], selectedAgentAvatar: agentAvatars[5]
            },
            agents: [],
            agentsEnabled: false,
            knowledgeBase: [],
            qnaData: [],
            userManagement: { users: [] }
        }
    }
];
