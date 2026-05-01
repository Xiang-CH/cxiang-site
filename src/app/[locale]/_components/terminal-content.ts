export type TerminalContent = {
    locale: string;
    onboarding: string;
    systemInfo: string;
    agentMsg: string;
    name: string;
    nameSecondary: string;
    typedRole: string;
    sysInit: string;
    sysKernel: string;
    links: {
        github: string;
        linkedin: string;
        x: string;
        resume: string;
    };
    about: string;
    stack: string;
    contactIntro: string;
    sectionLabels: {
        about: string;
        skills: string;
        experience: string;
        contact: string;
    };
    skillLabels: {
        languages: string;
        frameworks: string;
        tools: string;
    };
    experience: Array<{
        role: string;
        org: string;
        period: string;
        website: string;
        commit: string;
    }>;
};
