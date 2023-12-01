// Defines
const CONST = {
  /**패킷의 시작 값 */
  PK_STX: 0xc0,
  /**패킷의 종료 값 */
  PK_ETX: 0xc1,
  /**패킷 내 실데이터 값으로 STX, ETX가 포함되어 있을 때 escape 처리를 위한 값 */
  PK_DLE: 0x7d,

  PK_POS_CMD: 1,
  PK_POS_RESULT: 2,
  PK_POS_LENG1: 2,
  PK_POS_LENG2: 3,

  PK_HEADER_SIZE: 3,

  DEF_LIMIT: 1000,
  DEF_GROWTH: 1000,
};

export default CONST;
