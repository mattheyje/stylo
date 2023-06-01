import React, { useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Modal as GeistModal, Note, Spacer, useModal, useToasts } from '@geist-ui/core'

import styles from './articles.module.scss'
import buttonStyles from './button.module.scss'
import CorpusSelectItem from './corpus/CorpusSelectItem.jsx'
import fieldStyles from './field.module.scss'

import Modal from './Modal'
import Export from './Export'
import ArticleTags from './ArticleTags'

import Field from './Field'
import Button from './Button'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  Printer,
  Send,
  Trash,
  UserPlus
} from 'react-feather'

import {
  duplicateArticle,
  renameArticle,
  getArticleVersions,
  getArticleWorkspaces,
  deleteArticle,
  getArticleTags,
  getArticleContributors
} from './Article.graphql'

import {
  getTags
} from './Tag.graphql'

import useGraphQL, { useMutation } from '../hooks/graphql'
import TimeAgo from './TimeAgo.jsx'
import WorkspaceSelectItem from './workspace/WorkspaceSelectItem.jsx'
import { useSelector } from 'react-redux'
import ArticleContributors from './ArticleContributors.jsx'
import ArticleSendCopy from './ArticleSendCopy.jsx'

export default function Article ({ article, corpus, onArticleUpdated, onArticleDeleted, onArticleCreated }) {
  const activeUser = useSelector(state => state.activeUser)
  const articleId = article._id
  const {
    data: contributorsQueryData,
    error: contributorsError,
  } = useGraphQL({ query: getArticleContributors, variables: { articleId } }, {
    fallbackData: {
      article
    },
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const contributors = (contributorsQueryData?.article?.contributors || []).filter(c => c.user._id !== article.owner._id)
  const { data: userTagsQueryData } = useGraphQL({ query: getTags, variables: {} }, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const userTags = (userTagsQueryData?.user?.tags || [])
  const { data: articleTagsQueryData } = useGraphQL({ query: getArticleTags, variables: { articleId } }, {
    fallbackData: {
      article
    },
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const tags = (articleTagsQueryData?.article?.tags || [])
  const { data: articleVersionsQueryData, mutate: mutateArticleVersions } = useGraphQL({ query: getArticleVersions, variables: { articleId } }, {
    fallbackData: {
      article
    },
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const versions = (articleVersionsQueryData?.article?.versions || [])
  const { data: articleWorkspacesQueryData, mutate: mutateArticleWorkspaces } = useGraphQL({ query: getArticleWorkspaces, variables: { articleId } }, {
    fallbackData: {
      article
    },
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const workspaces = (articleWorkspacesQueryData?.article?.workspaces || [])

  const { t } = useTranslation()
  const { setToast } = useToasts()
  const {
    visible: deleteArticleVisible,
    setVisible: setDeleteArticleVisible,
    bindings: deleteArticleModalBinding
  } = useModal()

  const mutation = useMutation()
  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [renaming, setRenaming] = useState(false)

  const [newTitle, setNewTitle] = useState(article.title)
  const [corpusArticleIds, setCorpusArticleIds] = useState({})

  const [sharing, setSharing] = useState(false)
  const [sending, setSending] = useState(false)

  const isArticleOwner = activeUser._id === article.owner._id

  const handleWorkspaceUpdate = useCallback(() => {
    mutateArticleWorkspaces(articleWorkspacesQueryData, { revalidate: true })
  }, [])

  const handleCorpusUpdate = useCallback(({ corpusId, corpusArticleIds }) => {
    setCorpusArticleIds({
      ...corpusArticleIds,
      [corpusId]: corpusArticleIds
    })
  }, [corpusArticleIds])

  useEffect(() => {
    if (contributorsError) {
      setToast({
        type: 'error',
        text: `Unable to load contributors: ${contributorsError.toString()}`
      })
    }
  }, [contributorsError])

  useEffect(() => {
    setCorpusArticleIds(corpus.reduce((acc, item) => {
      acc[item._id] = item.articles.map((corpusArticle) => corpusArticle.article._id)
      return acc
    }, {}))
  }, [corpus])

  useEffect(() => {
    if (expanded) {
      mutateArticleWorkspaces(article, { revalidate: true})
      mutateArticleVersions(article, { revalidate: true })
    }
  }, [expanded])

  const toggleExpansion = useCallback((event) => {
    if (!event.key || [' ', 'Enter'].includes(event.key)) {
      setExpanded(!expanded)
    }
  }, [expanded])

  const duplicate = async () => {
    const duplicatedArticleQuery = await mutation({query: duplicateArticle, variables: { user: activeUser._id, to: activeUser._id, article: articleId }})
    onArticleCreated({
      ...article,
      ...duplicatedArticleQuery.duplicateArticle,
      contributors: [],
      versions: []
    })
  }

  const rename = async (e) => {
    e.preventDefault()
    await mutation({ query: renameArticle, variables: { user: activeUser._id, article: articleId, title: newTitle } })
    onArticleUpdated({
      ...article,
      title: newTitle
    })
    setRenaming(false)
  }

  const handleDeleteArticle = async () => {
    try {
      await mutation({ query: deleteArticle, variables: { article: articleId } })
      onArticleDeleted(article)
      setToast({
        type: 'default',
        text: `Article successfully deleted`
      })
    } catch (err) {
      setToast({
        type: 'error',
        text: `Unable to delete article: ${err.message}`
      })
    }
  }

  const closeSendingModal = useCallback(() => {
    setSending(false)
  }, [])

  const closeSharingModal = useCallback(() => {
    setSharing(false)
  }, [])

  const handleArticleTagsUpdated = useCallback((event) => {
    onArticleUpdated({
      ...article,
      tags: event.updatedTags
    })
  }, [articleId])

  return (
    <article className={styles.article}>
      {exporting && (
        <Modal title="Export" cancel={() => setExporting(false)}>
          <Export articleId={article._id} bib={article.workingVersion.bibPreview} name={article.title}/>
        </Modal>
      )}

      <GeistModal width="30rem" visible={sharing} onClose={closeSharingModal}>
        <h2>{t('article.shareModal.title')}</h2>
        <span className={styles.sendSubtitle}>
          <span className={styles.sendText}>{t('article.shareModal.description')}</span>
        </span>
        <GeistModal.Content>
          <ArticleContributors
            article={article}
            contributors={contributors}
          />
        </GeistModal.Content>
        <GeistModal.Action passive onClick={closeSharingModal}>{t('modal.close.text')}</GeistModal.Action>
      </GeistModal>

      <GeistModal width="25rem" visible={sending} onClose={closeSendingModal}>
        <h2>{t('article.sendCopyModal.title')}</h2>
        <span className={styles.sendSubtitle}>
          <span className={styles.sendText}>{t('article.sendCopyModal.description')}{' '}</span>
          <span><Send className={styles.sendIcon}/></span>
        </span>
        <GeistModal.Content>
          <ArticleSendCopy article={article} cancel={closeSendingModal}/>
        </GeistModal.Content>
        <GeistModal.Action passive onClick={closeSendingModal}>{t('modal.close.text')}</GeistModal.Action>
      </GeistModal>

      {!renaming && (
        <h1 className={styles.title} onClick={toggleExpansion}>
          <span tabIndex={0} onKeyUp={toggleExpansion} className={styles.icon}>
            {expanded ? <ChevronDown/> : <ChevronRight/>}
          </span>

          {article.title}

          <Button title="Edit" icon={true} className={styles.editTitleButton}
                  onClick={(evt) => evt.stopPropagation() || setRenaming(true)}>
            <Edit3 size="20"/>
          </Button>
        </h1>
      )}
      {renaming && (
        <form className={clsx(styles.renamingForm, fieldStyles.inlineFields)} onSubmit={(e) => rename(e)}>
          <Field autoFocus={true} type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                 placeholder="Article Title"/>
          <Button title="Save" primary={true} onClick={(e) => rename(e)}>
            <Check/> Save
          </Button>
          <Button title="Cancel" type="button" onClick={() => {
            setRenaming(false)
            setNewTitle(article.title)
          }}>
            Cancel
          </Button>
        </form>
      )}

      <aside className={styles.actionButtons}>

        {isArticleOwner &&
          <Button title="Delete" icon={true} onClick={() => setDeleteArticleVisible(true)}>
            <Trash/>
          </Button>}

        <GeistModal visible={deleteArticleVisible} {...deleteArticleModalBinding}>
          <h2>{t('article.deleteModal.title')}</h2>
          <GeistModal.Content>
            {t('article.deleteModal.confirmMessage')}
            {contributors && contributors.length > 0 && (<>
              <Spacer h={1}/>
              <Note label="Important" type="error">{t('article.deleteModal.contributorsRemovalNote')}</Note>
            </>)}
          </GeistModal.Content>
          <GeistModal.Action
            passive
            onClick={() => setDeleteArticleVisible(false)}
          >
            {t('modal.cancelButton.text')}
          </GeistModal.Action>
          <GeistModal.Action onClick={handleDeleteArticle}>{t('modal.confirmButton.text')}</GeistModal.Action>
        </GeistModal>

        <Button title="Duplicate" icon={true} onClick={() => duplicate()}>
          <Copy/>
        </Button>

        {<Button title="Send a copy" icon={true} onClick={() => setSending(true)}>
          <Send/>
        </Button>}

        {<Button title="Share article" icon={true} onClick={() => setSharing(true)}>
          <UserPlus/>
        </Button>}

        <Button title="Download a printable version" icon={true} onClick={() => setExporting(true)}>
          <Printer/>
        </Button>

        <Link title="Edit article" className={buttonStyles.primary} to={`/article/${article._id}`}>
          <Edit3/>
        </Link>

        <Link title="Preview (open a new window)" target="_blank" className={buttonStyles.icon}
              to={`/article/${article._id}/preview`}>
          <Eye/>
        </Link>
      </aside>

      <section className={styles.metadata}>
        <p className={styles.metadataAuthoring}>
          {tags.map((t) => (
            <span className={styles.tagChip} key={'tagColor-' + t._id} style={{ backgroundColor: t.color || 'grey' }}/>
          ))}
          <span className={styles.by}>{t('article.by.text')}</span> <span
          className={styles.author}>{article.owner.displayName}</span>
          {contributors?.length > 0 && (<span
            className={styles.contributorNames}><span>, {contributors.map(c => c.user.displayName || c.user.username).join(', ')}</span></span>)}
          <TimeAgo date={article.updatedAt} className={styles.momentsAgo}/>
        </p>

        {expanded && (
          <div>
            <h4>{t('article.versions.title')}</h4>
            <ul className={styles.versions}>
              {versions.map((v) => (
                <li key={`version-${v._id}`}>
                  <Link to={`/article/${article._id}/version/${v._id}`}>{`${
                    v.message ? v.message : 'no label'
                  } (v${v.version}.${v.revision})`}</Link>
                </li>
              ))}
            </ul>

            {userTags.length > 0 && <>
              <h4>{t('article.tags.title')}</h4>
              <div className={styles.editTags}>
                <ArticleTags
                  articleId={article._id}
                  userTags={userTags}
                  onArticleTagsUpdated={handleArticleTagsUpdated}/>
              </div>
            </>
            }

            <h4>{t('article.workspaces.title')}</h4>
            <ul className={styles.workspaces}>
              {activeUser.workspaces.map((workspace) => <WorkspaceSelectItem
                key={workspace._id}
                id={workspace._id}
                color={workspace.color}
                name={workspace.name}
                articleId={article._id}
                workspaceIds={workspaces.map(({ _id }) => _id)}
                onChange={handleWorkspaceUpdate}/>)}
            </ul>

            <h4>{t('article.corpus.title')}</h4>
            <ul className={styles.corpusList}>
              {corpus.map((c) => <CorpusSelectItem
                key={c._id}
                id={c._id}
                name={c.name}
                articleId={article._id}
                articleIds={corpusArticleIds[c._id] || []}
                onChange={handleCorpusUpdate}/>)}
            </ul>
          </div>
        )}
      </section>
    </article>
  )
}

Article.propTypes = {
  handleYaml: PropTypes.func,
  readOnly: PropTypes.bool,
  yaml: PropTypes.string,
}
