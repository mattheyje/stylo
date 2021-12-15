import React, { useCallback } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

import styles from './writeLeft.module.scss'
import Stats from './Stats'
import Biblio from './Biblio'
import Sommaire from './Sommaire'
import Versions from './Versions'
import WorkingVersion from './WorkingVersion'
import Button from "../Button";
import { Menu } from "react-feather";
import { Link } from "react-router-dom";
import buttonStyles from "../button.module.scss";
import WriteRight from "./WriteRight";

function WriteLeft ({ article, readOnly, compareTo, yaml, handleYaml, selectedVersion, onTableOfContentClick }) {
  const articleStats = useSelector(state => state.articleStats, shallowEqual)
  const dispatch = useDispatch()
  const toggleExpand = useCallback(() => dispatch({ type: 'ARTICLE_PREFERENCES_TOGGLE', key: 'expandSidebarLeft' }), [])

  const focusMode = useSelector(state => state.articlePreferences.focusMode)
  const expanded = !focusMode

  return (
    <>
    <div className={[styles.side, expanded ? styles.expanded : ''].join(' ')}>
    {/*<Button onClick={toggleExpand}><Menu/> Open</Button>*/}
      {<nav className={styles.menu}>
      {/*<nav*/}
      {/*  onClick={toggleExpand}*/}
      {/*  className={expanded ? styles.close : styles.open}*/}
      {/*>*/}
      {/*  {expanded ? 'close' : 'open'}*/}
      {/*</nav>*/}
      {
        <div>
          <Versions
            article={article}
            selectedVersion={selectedVersion}
            compareTo={compareTo}
            readOnly={readOnly}
          />
          <Biblio readOnly={readOnly} article={article} />
          <Sommaire onTableOfContentClick={onTableOfContentClick} />
          <WriteRight
            yaml={yaml}
            handleYaml={handleYaml}
            readOnly={readOnly}
          />
          {/*<Stats stats={articleStats} />*/}
        </div>
      }
    </nav>}
    </div>
    </>
  )
}

export default WriteLeft
