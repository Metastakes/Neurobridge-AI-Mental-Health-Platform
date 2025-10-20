// diagnosticToolsData.ts
// Fix: Add file extension to import to resolve module error.
import { DiagnosticTool } from './types.ts';

export const diagnosticTools: DiagnosticTool[] = [
    {
        id: 'phq-9',
        name: 'PHQ-9 (Depression)',
        description: 'The Patient Health Questionnaire-9 is a multipurpose instrument for screening, diagnosing, monitoring and measuring the severity of depression.',
        questions: [
            {
                id: 'q1',
                text: 'Little interest or pleasure in doing things',
                options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            },
            {
                id: 'q2',
                text: 'Feeling down, depressed, or hopeless',
                options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            },
            {
                id: 'q3',
                text: 'Trouble falling or staying asleep, or sleeping too much',
                options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            }
        ]
    },
    {
        id: 'gad-7',
        name: 'GAD-7 (Anxiety)',
        description: 'The Generalized Anxiety Disorder-7 is a self-administered patient questionnaire used as a screening tool and severity measure for generalized anxiety disorder.',
        questions: [
            {
                id: 'q1',
                text: 'Feeling nervous, anxious, or on edge',
                 options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            },
            {
                id: 'q2',
                text: 'Not being able to stop or control worrying',
                 options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            },
            {
                id: 'q3',
                text: 'Worrying too much about different things',
                 options: [
                    { text: 'Not at all', value: 0 },
                    { text: 'Several days', value: 1 },
                    { text: 'More than half the days', value: 2 },
                    { text: 'Nearly every day', value: 3 },
                ]
            }
        ]
    }
];
