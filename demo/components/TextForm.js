// @flow
import React from 'react'

export default class TextForm extends React.Component<Object, Object> {
  props: {
    label: string,
    placeholder: string,
    onSubmit: string => any,
    onCancel: () => any
  }

  state = {
    input: ''
  }

  updateInput = (event: SyntheticEvent<HTMLInputElement>) =>
    this.setState({ input: event.currentTarget.value })

  handle = (handler: (input: string) => any) => (event: Event) => {
    event.preventDefault()
    handler(this.state.input)
  }

  render() {
    const onSubmit = this.handle(this.props.onSubmit)
    const onCancel = this.handle(this.props.onCancel)
    return (
      <form className="form-inline" onSubmit={onSubmit}>
        <div className="form-group">
          <label>
            <span className="sr-only">{this.props.label}</span>
            <input
              type="text"
              className="form-control mr-1"
              placeholder={this.props.placeholder}
              value={this.state.input}
              onChange={this.updateInput}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary mr-1"
            onClick={onSubmit}
          >
            Submit
          </button>
          <button
            type="cancel"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }
}
