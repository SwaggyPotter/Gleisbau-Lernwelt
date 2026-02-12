import { pool } from './db/pool';

export const ACCOUNT_DELETION_GRACE_DAYS = 30;

export const purgeDueDeletedUsers = async (): Promise<number> => {
  const { rowCount } = await pool.query(
    `DELETE FROM users
     WHERE role <> 'admin'
       AND deletion_due_at IS NOT NULL
       AND deletion_due_at <= now()`,
  );
  return rowCount ?? 0;
};

export const deletionNoticeMessage = (deletionDueAt: string | Date): string => {
  const dueDate = new Date(deletionDueAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `Dieser Account ist zur Loeschung vorgemerkt und wird am ${dueDate} endgueltig geloescht. Bitte melde dich beim Admin, wenn der Account erhalten bleiben soll.`;
};
