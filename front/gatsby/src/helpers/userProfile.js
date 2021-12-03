import { useDispatch, useSelector } from "react-redux"

export function getUserProfile({ backendEndpoint }) {
  return fetch(`${backendEndpoint}/profile`, {
    method: 'GET',
    credentials: 'include',
    cors: true,
  }).then((res) => res.json())
}

export function useProfile () {
  const backendEndpoint = useSelector(state => state.applicationConfig.backendEndpoint)
  const dispatch = useDispatch()

  return function refreshProfile () {
    return getUserProfile({ backendEndpoint })
      .then((response) => dispatch({ type: 'PROFILE', ...response }))
  }
}
