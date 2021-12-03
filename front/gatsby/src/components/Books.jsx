import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useGraphQL } from '../helpers/graphQL'
import styles from './books.module.scss'

import Book from './Book'

function Books () {
  const [isLoading, setIsLoading] = useState(true)
  const [tags, setTags] = useState([])
  const [needReload, setNeedReload] = useState(true)
  const displayName = useSelector(state => state.activeUser.displayName)
  const userId = useSelector(state => state.activeUser._id)
  const runQuery = useGraphQL()

  useEffect(() => {
    if (needReload) {
      //Self invoking async function
      ;(async () => {
        try {
          const query = `query($user:ID!){user(user:$user){ displayName tags{ _id name updatedAt articles{ _id title updatedAt versions(limit:1){ _id version revision message } } } } }`
          const user = { user: userId }
          setIsLoading(true)
          const data = await runQuery({ query, variables: user })
          //Need to sort by updatedAt desc
          setTags(data.user.tags.reverse())
          setIsLoading(false)
          setNeedReload(false)
        } catch (err) {
          alert(err)
        }
      })()
    }
  }, [needReload])

  return (
    <section className={styles.section}>
      <h1>Books for {displayName}</h1>
      <p>
        Books are like super-tags, they are a collection of articles that you
        can sort and export all at once
      </p>
      <p>Below are your tags eligible to be books:</p>
      {!isLoading &&
        tags.map((t) => (
          <Book
            key={`book-${t._id}`}
            {...t}
            setNeedReload={() => setNeedReload(true)}
          />
        ))}
    </section>
  )
}

export default Books
