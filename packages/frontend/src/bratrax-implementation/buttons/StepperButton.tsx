import {
    Button as MantineButton,
    ButtonProps as MantineButtonProps,
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

interface ButtonProps extends Omit<MantineButtonProps, 'variant'> {
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
    onClick?: () => void;
    rightIcon?: boolean;
    leftIcon?: boolean;
}

const Button = ({
    variant = 'primary',
    disabled = false,
    children,
    onClick,
    rightIcon,
    leftIcon,
    ...props
}: ButtonProps) => {
    const variantStyles = {
        primary: {
            color: 'blue',
            variant: 'filled',
        },
        secondary: {
            color: 'gray',
            variant: 'outline',
        },
    } as const;

    const { color, variant: mantineVariant } = variantStyles[variant];

    return (
        <MantineButton
            disabled={disabled}
            color={color}
            variant={mantineVariant}
            size="md"
            onClick={onClick}
            radius="sm"
            leftIcon={leftIcon ? <IconArrowLeft size={18} /> : undefined}
            rightIcon={rightIcon ? <IconArrowRight size={18} /> : undefined}
            sx={(theme) => ({
                padding: '4px 14px',
                height: 40,
                fontWeight: 600,
                letterSpacing: '0.3px',
                transition: 'all 200ms ease',

                ...(variant === 'primary' && {
                    background: theme.colors.blue[6],
                    '&:hover': {
                        background: theme.colors.blue[7],
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 14px 0 ${theme.fn.rgba(
                            theme.colors.blue[6],
                            0.25,
                        )}`,
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                        background: theme.colors.blue[8],
                        boxShadow: `0 2px 6px 0 ${theme.fn.rgba(
                            theme.colors.blue[6],
                            0.25,
                        )}`,
                    },
                }),

                ...(variant === 'secondary' && {
                    color: theme.colors.gray[7],
                    borderColor: theme.colors.gray[4],
                    backgroundColor: theme.white,
                    '&:hover': {
                        backgroundColor: theme.colors.gray[0],
                        color: theme.colors.gray[9],
                        borderColor: theme.colors.gray[5],
                    },
                    '&:active': {
                        backgroundColor: theme.colors.gray[1],
                        borderColor: theme.colors.gray[6],
                    },
                }),

                '&:disabled': {
                    backgroundColor:
                        variant === 'primary'
                            ? theme.fn.rgba(theme.colors.blue[6], 0.5)
                            : theme.colors.gray[0],
                    color:
                        variant === 'primary'
                            ? theme.white
                            : theme.colors.gray[4],
                    opacity: variant === 'primary' ? 0.6 : 0.4,
                    borderColor:
                        variant === 'secondary'
                            ? theme.colors.gray[3]
                            : 'transparent',
                    cursor: 'not-allowed',
                    transform: 'none',
                    boxShadow: 'none',
                    pointerEvents: 'none',
                },
            })}
            {...props}
        >
            {children}
        </MantineButton>
    );
};

export default Button;
