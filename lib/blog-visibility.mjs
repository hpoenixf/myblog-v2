/** Keep merged URLs readable without listing them as independent posts. */
export function isUnmergedPost(post) {
  return !post.mergedInto
}
