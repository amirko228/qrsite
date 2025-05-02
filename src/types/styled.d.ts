import 'styled-components';
import { Theme } from '@mui/material/styles';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

declare module 'styled-components' {
  export interface StyledComponent<P, T> {
    ref?: React.Ref<any>;
  }
} 