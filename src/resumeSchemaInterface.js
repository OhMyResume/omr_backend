export const resumeSchemaInterface = `Resume {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      website?: string;
    };
    applyingFor: string;
    education: Array<{
      institution: string;
      location: string;
      degree: string;
      major: string;
      startDate: string;
      endDate: string;
    }>;
    publications: Array<{
      title: string;
      authors: string[];
      conference: string;
      year: number;
      award?: string;
    }>;
    experience: Array<{
      position: string;
      company: string;
      startDate: string;
      endDate: string;
      responsibilities: string[];
    }>;
    awards: Array<{
      name: string;
      year: number;
    }>;
    skills: {
      programmingLanguages: string[];
      toolsAndFrameworks: string[];
      languages: Array<{
        language: string;
        proficiency: string;
      }>;
    };
  }`;
