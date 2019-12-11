const parseQuery = () => {
  const searchParams = new URL(location.href).searchParams

  const result = {}
  for (const key of searchParams.keys()) {
    const array = searchParams.getAll(key)
    result[key] = array.length === 1 ? array[0] : array
  }

  return result
}

export default parseQuery
