import React, {useState} from 'react'
import {connect} from 'react-redux'

import styles from './bibliographe.module.scss'
import etv from '../../../helpers/eventTargetValue'
import bib2key from './CitationsFilter'
import askGraphQL from '../../../helpers/graphQL';
import { fetchBibliographyFromCollection } from '../../../helpers/zotero'

const mapStateToProps = ({ logedIn, sessionToken, activeUser }) => {
  return { logedIn, sessionToken, activeUser  }
}

const ConnectedBibliographe = (props) => {
  const defaultSuccess = (result) => console.log(result)
  const success = props.success || defaultSuccess
  const [selector,setSelector] = useState('zotero')
  const [isSaving, setSaving] = useState(false)
  const [bib,setBib] = useState(props.bib)
  const [addCitation,setAddCitation] = useState('')
  const [zoteroLink,setZoteroLink] = useState(props.article.zoteroLink || "")


  const mergeCitations = () => {
    setBib(bib + '\n' + addCitation)
    setAddCitation('')
  }

  const removeCitation = (index) => {
    const nextArray = bib2key(bib)
    nextArray.splice(index, 1)
    setBib(nextArray.map(b => b.title).join('\n'))
  }

  const saveNewZotero = async () => {
    setSaving(true)

    // saveOnGraphQL
    if (props.article.zoteroLink !== zoteroLink) {
      console.log("saving to graphQL", props.article.zoteroLink, zoteroLink, props.sessionToken)
      try {
        const query =`mutation($user:ID!,$article:ID!,$zotero:String!){zoteroArticle(article:$article,zotero:$zotero,user:$user){ _id zoteroLink}}`
        const variables = { zotero: zoteroLink, user: props.activeUser._id, article: props.article._id }
        await askGraphQL({ query,variables }, "updating zoteroLink", props.sessionToken)
      }
      catch (err) {
        setSaving(false)
        alert(err)
      }
    }
    
    // we synchronize the collection, any time we save
    if (zoteroLink) {
      await fetchBibliographyFromCollection(zoteroLink).then(result => {
        setSaving(false)
        const bib = result.join('\n')
        setBib(bib)
        success(bib)
        props.cancel()
      })
    }
    else {
      // previous value was empty, and we tried to save an empty value again
      setSaving(false)
    }
  }

  return (
    <article>
      <h1 className={styles.title}>Bibliographe</h1>
      <nav className={styles.selector}>
        <p className={selector === "zotero"?styles.selected:null} onClick={()=>setSelector('zotero')}>Zotero</p>
        <p className={selector === "citations"?styles.selected:null} onClick={()=>setSelector('citations')}>Citations</p>
        <p className={selector === "raw"?styles.selected:null} onClick={()=>setSelector('raw')}>Raw bibtex</p>
      </nav>

      {selector === 'zotero' && <div className={styles.zotero}>
        <form disabled={isSaving} onSubmit={(e) => e.preventDefault() && saveNewZotero()}>
          <p>Please paste the URL of your zotero library, so that it looks like https://www.zotero.org/groups/<strong>[IDnumber]/collections/[IDcollection]</strong></p>
          <label>https://www.zotero.org/groups/</label>
          <input type="text" placeholder="[IDnumber]/collections/[IDcollection]" value={zoteroLink} onChange={e=>setZoteroLink(etv(e))}/>
          <button type="submit" onClick={() => saveNewZotero()} disabled={isSaving || (!zoteroLink && zoteroLink === props.article.zoteroLink)}>{isSaving ? 'Saving…' : 'Save zotero link and fetch'}</button>
        </form>
      </div>}

      {selector === 'citations' && <div className={styles.citations}>
      <textarea value={addCitation} onChange={(e)=>setAddCitation(etv(e))} placeholder="Paste here the bibtext of the citation you want to add"/><button onClick={()=>mergeCitations()}>Add</button>
      {bib2key(bib).map((b,i)=><p key={`citation-${b.cle}-${i}`} className={styles.citation}>@{b.cle}<i onClick={()=>removeCitation(i)}>Remove</i></p>)}
      </div>}
      {selector === 'raw' && <div className={styles.raw}>
        <textarea value={bib} onChange={(e)=>setBib(etv(e))} />
      </div>}
      <button onClick={()=>{success(bib);props.cancel()}} className={styles.primary}>Save</button>

    </article>
  )
}

const Bibliographe = connect(
  mapStateToProps
)(ConnectedBibliographe)

export default Bibliographe
