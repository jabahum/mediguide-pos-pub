import * as React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ClinicalToolDefinition } from '@/services/clinical-tool.service'
import { NativeClinicalTool } from './native-clinical-tool'
const load = (name: string): ClinicalToolDefinition => JSON.parse(readFileSync(join(process.cwd(),'..','clinical-tools','migrations','v1','definitions',`${name}.json`),'utf8')).definition
afterEach(() => { cleanup(); vi.restoreAllMocks() })
describe('native clinical form', () => {
  it('shows defaults, changes method-specific fields, and restores defaults on reset', () => {
    const definition = load('pregnancy-due-date-calculator')
    render(<NativeClinicalTool definition={definition} />)
    const inputLabel = (key: string) => definition.inputs.find((field) => field.key === key)!.label
    const method = screen.getByLabelText(new RegExp(inputLabel('method')))
    expect(method).toHaveValue('lmp')
    expect(screen.getByLabelText(new RegExp(inputLabel('cycle_length')))).toHaveValue(28)
    expect(screen.queryByLabelText(new RegExp(inputLabel('ultrasound_weeks')))).toBeNull()
    fireEvent.change(method,{target:{value:'ultrasound'}})
    expect(screen.getByLabelText(new RegExp(inputLabel('ultrasound_weeks')))).toBeInTheDocument()
    expect(screen.queryByLabelText(new RegExp(inputLabel('lmp_date')))).toBeNull()
    vi.spyOn(window,'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button',{name:'Reset'}))
    expect(method).toHaveValue('lmp')
    expect(screen.getByLabelText(new RegExp(inputLabel('cycle_length')))).toHaveValue(28)
  })
  it('normalizes units, renders precision, clears results after edits and rejects fractional integers', () => {
    const definition = load('bmi-calculator')
    render(<NativeClinicalTool definition={definition} />)
    const weight = screen.getByLabelText('Weight *'), height = screen.getByLabelText('Height *')
    fireEvent.change(weight,{target:{value:'70'}})
    fireEvent.change(screen.getByLabelText('Height unit'),{target:{value:'cm'}})
    fireEvent.change(height,{target:{value:'175'}})
    fireEvent.click(screen.getByRole('button',{name:'Calculate'}))
    expect(screen.getByRole('heading',{name:'Results'})).toBeInTheDocument()
    expect(screen.getByText('22.9 kg/m²')).toBeInTheDocument()
    fireEvent.change(weight,{target:{value:'71'}})
    expect(screen.queryByRole('heading',{name:'Results'})).toBeNull()
    cleanup()
    const bp = load('blood-pressure-assessment')
    render(<NativeClinicalTool definition={bp} />)
    fireEvent.change(screen.getByLabelText(new RegExp(bp.inputs[0].label)),{target:{value:'120.5'}})
    fireEvent.change(screen.getByLabelText(new RegExp(bp.inputs[1].label)),{target:{value:'80'}})
    fireEvent.click(screen.getByRole('button',{name:'Calculate'}))
    expect(screen.getByText('Invalid numeric input: systolic')).toBeInTheDocument()
  })
  it('clears responses when the definition changes', () => {
    const definition = load('bmi-calculator'), view = render(<NativeClinicalTool definition={definition} />)
    fireEvent.change(screen.getByLabelText('Weight *'),{target:{value:'70'}})
    view.rerender(<NativeClinicalTool definition={{...definition, version:'2.0.0'}} />)
    expect(screen.getByLabelText('Weight *')).toHaveValue(null)
  })
})
