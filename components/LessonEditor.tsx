import React, { useState } from 'react';
import { Lesson, BlockType, ContentBlock, CommandLabBlock, AbilityTag, CoreContentTag, Grade, TextBlock, ImageBlock, QuizBlock } from '../types';
import { LGR22_LABELS } from '../constants';
import { COMMAND_REGISTRY } from '../services/commandRegistry';

interface Props {
  initialLesson?: Lesson;
  onSave: (lesson: Lesson) => void;
  lang: 'sv' | 'en' | 'ar' | 'uk' | 'ti';
}

const LessonEditor: React.FC<Props> = ({ initialLesson, onSave, lang }) => {
  const [lesson, setLesson] = useState<Lesson>(initialLesson || {
    id: Date.now().toString(),
    title: '',
    description: '',
    grade: Grade.SEVEN,
    blocks: [],
    lgr22: { abilities: [], coreContent: [] },
    isPublished: false,
    createdAt: new Date().toISOString()
  });

  const updateLesson = (field: keyof Lesson, value: any) => {
    setLesson(prev => ({ ...prev, [field]: value }));
  };

  const addBlock = (type: BlockType) => {
    const id = Date.now().toString();
    let newBlock: ContentBlock;

    switch (type) {
      case BlockType.TEXT:
        newBlock = {
          id,
          type: BlockType.TEXT,
          content: 'Nytt textavsnitt...'
        };
        break;
      case BlockType.IMAGE:
        newBlock = {
          id,
          type: BlockType.IMAGE,
          url: 'https://picsum.photos/400/300',
          alt: 'Bildbeskrivning',
          caption: ''
        };
        break;
      case BlockType.QUIZ:
        newBlock = {
          id,
          type: BlockType.QUIZ,
          question: 'Fråga?',
          options: [],
          explanation: ''
        };
        break;
      case BlockType.COMMAND_LAB:
        newBlock = {
          id,
          type: BlockType.COMMAND_LAB,
          instruction: 'Prova att ändra koden.',
          targetCommandId: 'circle',
          initialCode: 'circle(200, 200, 50, "#ef4444");'
        };
        break;
      default:
        // Handle other block types or return if not supported in this editor
        return;
    }

    setLesson(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setLesson(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } as ContentBlock : b)
    }));
  };

  const changeLabTemplate = (blockId: string, commandId: string) => {
      const def = COMMAND_REGISTRY[commandId];
      if (!def) return;

      // Construct default code based on registry defaults
      const args = def.params.map(p => typeof p.defaultValue === 'string' ? `"${p.defaultValue}"` : p.defaultValue).join(', ');
      const code = `${def.functionName}(${args});`;

      updateBlock(blockId, {
          targetCommandId: commandId,
          initialCode: code
      } as Partial<CommandLabBlock>);
  };

  const toggleTag = (type: 'abilities' | 'coreContent', tag: string) => {
    const current = lesson.lgr22[type] as string[];
    const updated = current.includes(tag) 
      ? current.filter(t => t !== tag) 
      : [...current, tag];
    
    setLesson(prev => ({
      ...prev,
      lgr22: { ...prev.lgr22, [type]: updated }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32">
      {/* Meta Data */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Lektionsinställningar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Titel</label>
            <input 
              type="text" 
              value={lesson.title} 
              onChange={e => updateLesson('title', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Årskurs</label>
            <select 
              value={lesson.grade} 
              onChange={e => updateLesson('grade', e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </div>
          <div className="col-span-full space-y-2">
             <label className="block text-sm font-medium">Beskrivning</label>
             <textarea 
               value={lesson.description}
               onChange={e => updateLesson('description', e.target.value)}
               className="w-full border p-2 rounded h-20"
             />
          </div>
        </div>
      </section>

      {/* Lgr22 Mapping */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Koppling till Lgr22</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Förmågor</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(AbilityTag).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag('abilities', tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    lesson.lgr22.abilities.includes(tag) 
                    ? 'bg-blue-100 text-blue-800 border-blue-200 border' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {LGR22_LABELS[lang][tag]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Centralt Innehåll</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(CoreContentTag).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag('coreContent', tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    lesson.lgr22.coreContent.includes(tag) 
                    ? 'bg-green-100 text-green-800 border-green-200 border' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {LGR22_LABELS[lang][tag]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Block Editor */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Innehåll</h2>
          <div className="flex space-x-2">
            <button onClick={() => addBlock(BlockType.TEXT)} className="bg-slate-200 px-3 py-1 text-sm rounded hover:bg-slate-300">+ Text</button>
            <button onClick={() => addBlock(BlockType.COMMAND_LAB)} className="bg-purple-100 text-purple-700 px-3 py-1 text-sm rounded hover:bg-purple-200">+ Kod Labb</button>
            <button onClick={() => addBlock(BlockType.QUIZ)} className="bg-orange-100 text-orange-700 px-3 py-1 text-sm rounded hover:bg-orange-200">+ Quiz</button>
            <button onClick={() => addBlock(BlockType.IMAGE)} className="bg-slate-200 px-3 py-1 text-sm rounded hover:bg-slate-300">+ Bild</button>
          </div>
        </div>
        
        <div className="space-y-4">
          {lesson.blocks.map((block, idx) => (
            <div key={block.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative group">
              <span className="absolute top-2 right-2 text-xs text-slate-300 font-mono">#{idx+1} {block.type}</span>
              
              {block.type === BlockType.TEXT && (
                <textarea 
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  className="w-full h-32 p-3 border rounded font-sans"
                  placeholder="Markdown text here..."
                />
              )}

              {block.type === BlockType.COMMAND_LAB && (
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded border border-purple-100 mb-2">
                    <div className="text-xs font-bold text-purple-800 uppercase mb-2">Lab Template</div>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(COMMAND_REGISTRY).map(cmd => (
                            <button
                                key={cmd.id}
                                onClick={() => changeLabTemplate(block.id, cmd.id)}
                                className={`px-3 py-1 text-xs rounded border transition ${
                                    block.targetCommandId === cmd.id 
                                    ? 'bg-purple-600 text-white border-purple-700' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'
                                }`}
                            >
                                {cmd.functionName}
                            </button>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold block mb-1">Instruktion</label>
                    <input 
                        type="text" 
                        value={block.instruction} 
                        onChange={e => updateBlock(block.id, { instruction: e.target.value })}
                        className="w-full border p-2 text-sm rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Startkod (Initial State)</label>
                    <input 
                        type="text" 
                        value={block.initialCode} 
                        onChange={e => updateBlock(block.id, { initialCode: e.target.value })}
                        className="w-full border p-2 font-mono text-sm rounded bg-slate-50"
                    />
                  </div>
                </div>
              )}

               {block.type === BlockType.IMAGE && (
                 <input type="text" value={block.url} onChange={e => updateBlock(block.id, { url: e.target.value })} className="w-full border p-2" placeholder="Image URL" />
               )}

              <button 
                onClick={() => setLesson(prev => ({...prev, blocks: prev.blocks.filter(b => b.id !== block.id)}))}
                className="text-red-400 text-xs hover:text-red-600 mt-2"
              >
                Ta bort block
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-4 z-50">
        <button className="text-slate-500 hover:text-slate-700">Avbryt</button>
        <button 
          onClick={() => onSave(lesson)}
          className="bg-brand-600 text-white px-6 py-2 rounded-md font-medium hover:bg-brand-700 shadow-lg shadow-brand-200"
        >
          Spara Lektion
        </button>
      </div>
    </div>
  );
};

export default LessonEditor;