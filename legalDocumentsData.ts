// legalDocumentsData.ts
// Fix: Add file extension to import to resolve module error.
import { LegalDocument } from './types.ts';

export const legalDocuments: LegalDocument[] = [
    {
        id: 'tos',
        title: 'Terms of Service',
        content: `
Welcome to Health Companion!

These terms and conditions outline the rules and regulations for the use of Health Companion's Website.

By accessing this website we assume you accept these terms and conditions. Do not continue to use Health Companion if you do not agree to take all of the terms and conditions stated on this page.

The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves.

... (more placeholder text)
        `
    },
    {
        id: 'privacy',
        title: 'Privacy Policy',
        content: `
Your privacy is important to us. It is Health Companion's policy to respect your privacy regarding any information we may collect from you across our website.

We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.

We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.

... (more placeholder text)
        `
    }
];
