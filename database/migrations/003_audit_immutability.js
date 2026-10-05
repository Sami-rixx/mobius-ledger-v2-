/**
 * Defense-in-depth: reject UPDATE/DELETE against audit_trail at the
 * database level, in addition to removing the client-callable
 * create/delete HTTP endpoints at the application layer. This implements
 * the "server-only audit generation and database-level protection now"
 * baseline from the approved security architecture (cryptographic hash
 * chaining is deliberately deferred to a later hardening phase, but the
 * table layout below intentionally keeps room for it - see
 * backend/src/services/auditTrailService.js).
 */
export default {
  id: '003_audit_immutability',
  description: 'SQLite triggers blocking UPDATE/DELETE on audit_trail',
  up(db) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_audit_trail_block_update
      BEFORE UPDATE ON audit_trail
      BEGIN
        SELECT RAISE(ABORT, 'audit_trail records are immutable and cannot be updated');
      END;
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_audit_trail_block_delete
      BEFORE DELETE ON audit_trail
      BEGIN
        SELECT RAISE(ABORT, 'audit_trail records are immutable and cannot be deleted');
      END;
    `);
  }
};
