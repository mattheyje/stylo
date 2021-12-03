import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import etv from '../helpers/eventTargetValue'
import { useGraphQL } from '../helpers/graphQL'

import styles from './createTag.module.scss'
import Field from './Field'
import Button from './Button'
import { Check } from 'react-feather'

function CreateTag (props) {
  const [articlesSelected, setArticlesSelected] = useState(
    props.articles.map((a) => ({ selected: false, _id: a._id, title: a.title }))
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const userId = useSelector(state => state.activeUser._id)
  const runQuery = useGraphQL()

  let baseQuery =
    'mutation($name:String!, $description:String, $user:ID!){ createTag(name:$name,description:$description,user:$user){ _id name } '
  let addToTag = articlesSelected
    .filter((a) => a.selected)
    .map(
      (a, i) =>
        `addToTag${i}: addToTag(article:"${a._id}",tag:"new",user:$user){ _id }`
    )
    .join(' ')
  const query = baseQuery + addToTag + '}'
  const variables = { user: userId, name, description }

  const createTag = async (event, query, variables) => {
    try {
      event.preventDefault()
      await runQuery({ query, variables })
      props.triggerReload()
    } catch (err) {
      alert(err)
    }
  }

  return (
    <section className={styles.create}>
      <form
        onSubmit={(event) => {
          createTag(
            event,
            query,
            variables,
          )
        }}
      >
        <Field
          type="text"
          placeholder="Tag Name"
          autoFocus={true}
          className={styles.tagName}
          value={name}
          onChange={(e) => setName(etv(e))}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(etv(e))}
        />

        <ul className={styles.actions}>
          <li>
            <Button type="button" onClick={props.cancel}>Cancel</Button>
          </li>
          <li>
            <Button primary={true} type="submit" title="Create Article">
              <Check />
              Create Tag
            </Button>
          </li>
        </ul>
      </form>
    </section>
  )
}

export default CreateTag
