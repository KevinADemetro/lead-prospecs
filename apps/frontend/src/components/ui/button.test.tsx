import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders the label', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled();
  });
});
