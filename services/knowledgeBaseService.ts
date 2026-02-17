import { StudentLevel } from '../types';

export interface KnowledgeBase {
    level: string;
    description: string;
    vocabulary: {
        topics?: string[];
        required_words?: string[];
        level_description?: string;
        // New structure support
        high_frequency_words?: string[];
        phrase_bank?: string[];
        level_requirement?: string;
    };
    grammar?: string[];
    // New structure support
    grammar_focus?: {
        complex_structures?: string[];
        sentence_variety?: string;
    };
    writing_standards: {
        word_count: string;
        complexity?: string;
        structure: string;
        cohesion?: string;
        scoring_points?: string;
    };
    correction_focus?: string[];
    // New structure support
    topic_coverage?: {
        summary: string;
        categories: {
            name: string;
            sub_topics: string[];
            example_prompts?: string[];
        }[];
    };
    curriculum_standard?: string;
}

const levelToFilenameMap: Record<StudentLevel, string> = {
    [StudentLevel.Primary1_2]: 'primary1_2',
    [StudentLevel.Primary3_4]: 'primary3_4',
    [StudentLevel.Primary5_6]: 'primary5_6',
    [StudentLevel.Junior1]: 'junior1',
    [StudentLevel.Junior2]: 'junior2',
    [StudentLevel.Junior3]: 'junior3',
    [StudentLevel.Senior1]: 'senior1',
    [StudentLevel.Senior2]: 'senior2',
    [StudentLevel.Senior3]: 'senior3',
    [StudentLevel.University1_2]: 'university1_2',
    [StudentLevel.University3_4]: 'university3_4',
    [StudentLevel.Graduate]: 'graduate',
    [StudentLevel.TOEFL]: 'toefl',
    [StudentLevel.IELTS]: 'ielts'
};

const cache: Record<string, KnowledgeBase | null> = {};

/**
 * Fetches the knowledge base configuration for a given student level.
 * It tries to load a JSON file from /knowledge_base/{level_key}.json.
 * If the file doesn't exist or fails to load, it returns null.
 */
export const getKnowledgeBase = async (level: StudentLevel): Promise<KnowledgeBase | null> => {
    const filename = levelToFilenameMap[level];
    if (!filename) return null;

    if (cache[filename] !== undefined) {
        return cache[filename];
    }

    try {
        const response = await fetch(`/knowledge_base/${filename}.json`);
        if (!response.ok) {
            console.warn(`Knowledge base for ${level} (${filename}) not found.`);
            cache[filename] = null;
            return null;
        }
        const data = await response.json();
        cache[filename] = data as KnowledgeBase;
        return data as KnowledgeBase;
    } catch (error) {
        console.error(`Failed to load knowledge base for ${level}:`, error);
        cache[filename] = null;
        return null;
    }
};
