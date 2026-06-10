import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { input, inputErr, label as labelCls } from '../../lib/styles'

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-10 h-6 bg-cyber-border rounded-full peer peer-checked:bg-cyber-cyan peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm" />
    </label>
  )
}

function Field({ field, value, onChange, error }) {
  const cls = error ? `${inputErr}` : `${input}`

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-100 border border-cyber-border/60 transition-colors">
        <span className="text-sm text-cyber-text pr-3">
          {field.label}
          {field.required && <span className="text-cyber-red ml-0.5">*</span>}
        </span>
        <Toggle checked={value} onChange={v => onChange(field.key, v)} />
      </div>
    )
  }

  if (field.type === 'currency') {
    return (
      <div>
        <label className={labelCls}>
          {field.label}{field.required && <span className="text-cyber-red ml-0.5">*</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyber-muted font-data font-medium select-none">R$</span>
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(field.key, e.target.value)}
            placeholder="0,00"
            className={`${cls} pl-9`}
          />
        </div>
        {error && <p className="text-xs text-cyber-red mt-1">{error}</p>}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className={labelCls}>
          {field.label}{field.required && <span className="text-cyber-red ml-0.5">*</span>}
        </label>
        <select value={value || ''} onChange={e => onChange(field.key, e.target.value)}
          className={cls + ' [color-scheme:light]'}>
          <option value="">Selecione...</option>
          {field.optionGroups
            ? field.optionGroups.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                </optgroup>
              ))
            : (field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {error && <p className="text-xs text-cyber-red mt-1">{error}</p>}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className={labelCls}>
          {field.label}{field.required && <span className="text-cyber-red ml-0.5">*</span>}
        </label>
        <textarea
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
          rows={3}
          placeholder={field.placeholder}
          className={`${cls} resize-none`}
        />
        {error && <p className="text-xs text-cyber-red mt-1">{error}</p>}
      </div>
    )
  }

  if (field.type === 'radio') {
    return (
      <div>
        <label className={labelCls}>
          {field.label}{field.required && <span className="text-cyber-red ml-0.5">*</span>}
        </label>
        <div className="flex flex-wrap gap-4 mt-1">
          {(field.options || []).map(o => (
            <label key={o} className="flex items-center gap-2 text-sm text-cyber-muted cursor-pointer hover:text-cyber-text transition-colors">
              <input
                type="radio"
                value={o}
                checked={value === o}
                onChange={() => onChange(field.key, o)}
                className="accent-cyber-cyan"
              />
              {o}
            </label>
          ))}
        </div>
        {error && <p className="text-xs text-cyber-red mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <label className={labelCls}>
        {field.label}{field.required && <span className="text-cyber-red ml-0.5">*</span>}
      </label>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={value || ''}
        onChange={e => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={cls + (field.type === 'date' ? ' [color-scheme:light]' : '')}
      />
      {error && <p className="text-xs text-cyber-red mt-1">{error}</p>}
    </div>
  )
}

export default function DynamicForm({ sections = [], values = {}, onChange, errors = {} }) {
  const [open, setOpen] = useState(() => new Set(sections.map(s => s.id)))

  function toggle(id) {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!sections.length) {
    return (
      <div className="p-5 bg-cyber-surface/50 rounded-xl border border-cyber-border/50 text-sm text-cyber-muted text-center leading-relaxed">
        Preencha os dados gerais e selecione o tipo de seguro para ver os campos específicos.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sections.map(section => (
        <div key={section.id} className="border border-cyber-border/60 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(section.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-cyber-surface/50 hover:bg-cyber-surface transition-colors text-left cursor-pointer"
          >
            <span className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">{section.title}</span>
            {open.has(section.id)
              ? <ChevronUp size={14} className="text-cyber-muted shrink-0" />
              : <ChevronDown size={14} className="text-cyber-muted shrink-0" />
            }
          </button>

          {open.has(section.id) && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.fields.map(field => (
                <div key={field.key} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                  <Field
                    field={field}
                    value={values[field.key]}
                    onChange={onChange}
                    error={errors[field.key]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
