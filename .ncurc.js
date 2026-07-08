module.exports = {
  // Reject only dependencies whose upgrade is empirically broken or deliberately frozen; document why.
  reject: [
    // standard-version is deprecated upstream (final release 9.5.0, May 2022). Hold it so a surprise
    // post-deprecation release is never auto-adopted by ncu; the real fix is migrating the release
    // script to the maintained fork commit-and-tag-version.
    'standard-version'
  ]
}
