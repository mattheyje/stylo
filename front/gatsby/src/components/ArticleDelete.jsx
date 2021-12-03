import React from 'react'
import { useSelector } from 'react-redux'

import Button from './Button'

import styles from './Articles.module.scss'
import { useGraphQL } from '../helpers/graphQL'

function ArticleDelete ({ setNeedReload, _id }){
  const userId = useSelector(state => state.activeUser._id)
  const runQuery = useGraphQL()

  const deleteArticle = async () => {
    try {
      const query = `mutation($user:ID!,$article:ID!){deleteArticle(article:$article,user:$user){ _id }}`
      const variables = { user: userId, article: _id }
      await runQuery({ query, variables })
      setNeedReload()
    } catch (err) {
      alert(err)
    }
  }

  return (
    <Button className={styles.delete} onDoubleClick={() => deleteArticle()}>
      Delete
    </Button>
  )
}

export default ArticleDelete
