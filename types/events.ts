export interface FormEvent extends React.FormEvent<HTMLFormElement> {
  target: HTMLFormElement
}

export interface ChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement
} 