import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit3, Eye, Printer } from 'react-feather'
import { connect } from 'react-redux'
import { Check, ChevronDown, ChevronRight } from 'react-feather'

import Modal from './Modal'
import Export from './Export'
import Chapter from './Chapter'

import etv from '../helpers/eventTargetValue'
import { useGraphQL } from '../helpers/graphQL'
import formatTimeAgo from '../helpers/formatTimeAgo'
import { generateBookExportId } from "../helpers/identifier"

import styles from './book.module.scss'
import buttonStyles from './button.module.scss'

import Button from './Button'
import Field from './Field'
import { useSelector } from 'react-redux'

const alphaSort = (a, b) => a.title.localeCompare(b.title)

function Book (props) {
  const userId = useSelector(state => state.activeUser._id)

  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [tempName, setTempName] = useState(props.name)
  const [name, setName] = useState(props.name)
  const [isRenaming, setIsRenaming] = useState(false)

  const runQuery = useGraphQL()

  const renameBook = async () => {
    const query = `mutation($user:ID!,$tag:ID!,$name:String,$description:String){ updateTag(user:$user,tag:$tag,name:$name,description:$description){ _id name description } }`
    const variables = {
      user: userId,
      tag: props._id,
      name: tempName,
    }
    const newTag = await runQuery({ query, variables })
    setName(newTag.updateTag.name)
    setIsRenaming(false)
  }

  const bookTitle = `${name} (${formatTimeAgo(new Date(props.updatedAt))})`
  return (
    <article>
      {exporting && (
        <Modal cancel={() => setExporting(false)}>
          <Export
            exportId={generateBookExportId(props.name)}
            bookId={props._id}
          />
        </Modal>
      )}
      <header>
        {!isRenaming && (
          <h1 className={styles.bookTitle}>
            <span onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown /> : <ChevronRight />} {bookTitle}
            </span>
            <Button className={[buttonStyles.icon, styles.editTitleButton].join(' ')} onClick={() => setIsRenaming(true)}>
              <Edit3 />
            </Button>
          </h1>
        )}
        {isRenaming && (<form className={styles.renamingForm} onSubmit={(e) => renameBook(e)}>
          <Field autoFocus={true} type="text" value={tempName} onChange={(e) => setTempName(etv(e))} placeholder="Article Title" />
          <Button title="Save" primary={true} onClick={(e) => renameBook(e)}>
            <Check /> Save
          </Button>
          <Button title="Cancel" type="button" onClick={() => {
            setIsRenaming(false)
            setTempName(props.name)
          }}>
            Cancel
          </Button>
        </form>)}
        <ul className={styles.actions}>
          <li>
            <Link
              className={[buttonStyles.icon, buttonStyles.button, props.articles.length === 0 ? buttonStyles.isDisabled : ''].filter(d => d).join(' ')}
              title="Preview"
              target="_blank"
              to={`/books/${props._id}/preview`}
            >
              <Eye />
            </Link>
          </li>
          <li>
            <Button className={buttonStyles.icon} title="Export" onClick={() => setExporting(true)}>
              <Printer />
            </Button>
          </li>
        </ul>
      </header>
      {expanded && (
        <section>
          <h4>Chapters</h4>
          <ul>
            {props.articles.sort(alphaSort).map((a) => (
              <Chapter
                key={`chapter-${props._id}-${a._id}`}
                {...a}
                setNeedReload={props.setNeedReload}
              />
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export default Book
