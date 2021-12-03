import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Check, Edit3 } from 'react-feather'

import { useGraphQL } from '../helpers/graphQL'
import etv from '../helpers/eventTargetValue'
import Button from './Button'
import buttonStyles from './button.module.scss'
import styles from './chapter.module.scss'
import Field from './Field'

export default function Chapter (props) {
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(props.title)
  const [tempTitle, setTempTitle] = useState(props.title)
  const userId = useSelector(state => state.activeUser._id)
  const runQuery = useGraphQL()

  const rename = async (e) => {
    e.preventDefault()
    const query = `mutation($article:ID!,$title:String!,$user:ID!){renameArticle(article:$article,title:$title,user:$user){title}}`
    const variables = {
      user: userId,
      article: props._id,
      title: tempTitle,
    }
    await runQuery({ query, variables })
    setTitle(tempTitle)
    setRenaming(false)
    props.setNeedReload()
  }

  const latestVersion = props.versions[0]
  const articleTitle = `${title} (${latestVersion.version}.${latestVersion.revision}${latestVersion.message ? ` ${latestVersion.message}` : ''})`
  return (
    <>
      {!renaming && (
        <p>
          <Link to={`/article/${props._id}`}>{articleTitle}</Link>
          <Button className={[buttonStyles.icon, styles.renameButton].join(' ')} onClick={() => setRenaming(true)}>
            <Edit3/>
          </Button>
        </p>
      )}
      {renaming && renaming && (<form className={styles.renamingForm} onSubmit={(e) => rename(e)}>
        <Field autoFocus={true} type="text" value={tempTitle} onChange={(e) => setTempTitle(etv(e))} placeholder="Book Title" />
        <Button title="Save" primary={true} onClick={(e) => rename(e)}>
          <Check /> Save
        </Button>
        <Button title="Cancel" type="button" onClick={() => {
          setRenaming(false)
          setTempTitle(props.name)
        }}>
          Cancel
        </Button>
      </form>)}
    </>
  )
}
