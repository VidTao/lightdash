import {
    DashboardTileTypes,
    isDashboardChartTileType,
    type Dashboard,
    type DashboardTab,
} from '@lightdash/common';
import {
    ActionIcon,
    Box,
    Card,
    Flex,
    Group,
    LoadingOverlay,
    Menu,
    Text,
    Tooltip,
    getDefaultZIndex,
} from '@mantine/core';
import { useHover, useToggle } from '@mantine/hooks';
import {
    IconArrowAutofitContent,
    IconDots,
    IconEdit,
    IconTrash,
} from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useDelayedHover } from '../../../hooks/useDelayedHover';
import MantineIcon from '../../common/MantineIcon';
import DeleteChartTileThatBelongsToDashboardModal from '../../common/modal/DeleteChartTileThatBelongsToDashboardModal';
import ChartUpdateModal from '../TileForms/ChartUpdateModal';
import MoveTileToTabModal from '../TileForms/MoveTileToTabModal';
import TileUpdateModal from '../TileForms/TileUpdateModal';

import {
    ChartContainer,
    HeaderContainer,
    TileTitleLink,
    TitleWrapper,
} from './TileBase.styles';

type Props<T> = {
    isEditMode: boolean;
    belongsToDashboard?: boolean;
    title: string;
    titleLeftIcon?: ReactNode;
    chartName?: string;
    titleHref?: string;
    description?: string | null;
    tile: T;
    isLoading?: boolean;
    extraMenuItems?: ReactNode;
    onDelete: (tile: T) => void;
    onEdit: (tile: T) => void;
    children?: ReactNode;
    extraHeaderElement?: ReactNode;
    visibleHeaderElement?: ReactNode;
    minimal?: boolean;
    tabs?: DashboardTab[];
    lockHeaderVisibility?: boolean;
};

const TileBase = <T extends Dashboard['tiles'][number]>({
    isEditMode,
    title,
    titleLeftIcon,
    chartName,
    description = null,
    tile,
    isLoading = false,
    extraMenuItems = null,
    onDelete,
    onEdit,
    children,
    extraHeaderElement,
    visibleHeaderElement,
    titleHref,
    minimal = false,
    tabs,
    lockHeaderVisibility = false,
}: Props<T>) => {
    const [isEditingTileContent, setIsEditingTileContent] = useState(false);
    const [isMovingTabs, setIsMovingTabs] = useState(false);

    const [
        isDeletingChartThatBelongsToDashboard,
        setIsDeletingChartThatBelongsToDashboard,
    ] = useState(false);
    const { hovered: containerHovered, ref: containerRef } = useHover();
    const { isHovered: chartHovered, ...chartHoveredProps } = useDelayedHover({
        delay: 500,
    });
    const [titleHovered, setTitleHovered] = useState(false);
    const [isMenuOpen, toggleMenu] = useToggle([false, true]);

    const hideTitle =
        tile.type !== DashboardTileTypes.MARKDOWN
            ? tile.properties.hideTitle
            : false;
    const belongsToDashboard: boolean =
        isDashboardChartTileType(tile) && !!tile.properties.belongsToDashboard;

    const isMarkdownTileTitleEmpty =
        tile.type === DashboardTileTypes.MARKDOWN && !title;

    return (
        <Card
            component={Flex}
            className="tile-base"
            ref={containerRef}
            h="100%"
            direction="column"
            p="md"
            bg="white"
            radius="sm"
            shadow={isEditMode ? 'xs' : undefined}
            sx={(theme) => {
                let border = `1px solid ${theme.colors.gray[1]}`;
                if (isEditMode) {
                    border = `1px dashed ${theme.colors.blue[5]}`;
                }
                return {
                    overflow: 'unset',
                    border: border,
                };
            }}
        >
            <LoadingOverlay
                // ! Very important to have this class name on the tile loading overlay, otherwise the unfurl service will not be able to find it
                className="loading_chart_overlay"
                visible={isLoading ?? false}
                zIndex={getDefaultZIndex('modal') - 10}
            />

            <HeaderContainer
                $isEditMode={isEditMode}
                $isEmpty={isMarkdownTileTitleEmpty || hideTitle}
                style={{
                    alignItems: 'flex-start',
                    backgroundColor: 'white',
                    zIndex: isLoading ? getDefaultZIndex('modal') - 10 : 3,
                    borderRadius: '5px',
                }}
            >
                {minimal ? (
                    !hideTitle ? (
                        <Text fw={600} size="md">
                            {title}
                        </Text>
                    ) : (
                        <Box />
                    )
                ) : (
                    <Group
                        spacing="xs"
                        noWrap
                        align="start"
                        sx={{ overflow: 'hidden' }}
                    >
                        {titleLeftIcon}

                        <TitleWrapper $hovered={titleHovered}>
                            <Tooltip
                                disabled={!description}
                                label={
                                    <Text style={{ whiteSpace: 'pre-line' }}>
                                        {description}
                                    </Text>
                                }
                                multiline
                                position="top-start"
                                withinPortal
                                maw={400}
                            >
                                {isEditMode ||
                                tile.type === DashboardTileTypes.MARKDOWN ? (
                                    <Text fw={600} fz="md" hidden={hideTitle}>
                                        {title}
                                    </Text>
                                ) : (
                                    <Text
                                        component={TileTitleLink}
                                        href={titleHref}
                                        onMouseEnter={() =>
                                            setTitleHovered(true)
                                        }
                                        onMouseLeave={() =>
                                            setTitleHovered(false)
                                        }
                                        $hovered={titleHovered}
                                        target="_blank"
                                        className="non-draggable"
                                        hidden={hideTitle}
                                    >
                                        {title}
                                    </Text>
                                )}
                            </Tooltip>
                        </TitleWrapper>
                    </Group>
                )}
                <Group
                    spacing="xs"
                    className="non-draggable"
                    sx={{ marginLeft: 'auto' }}
                >
                    {visibleHeaderElement && (
                        <Group spacing="xs" className="non-draggable">
                            {visibleHeaderElement}
                        </Group>
                    )}
                    {(containerHovered && !titleHovered && !chartHovered) ||
                    isMenuOpen ||
                    lockHeaderVisibility ? (
                        <>
                            {extraHeaderElement}

                            {(isEditMode ||
                                (!isEditMode && extraMenuItems)) && (
                                <Menu
                                    withArrow
                                    withinPortal
                                    shadow="md"
                                    position="bottom-end"
                                    offset={4}
                                    arrowOffset={10}
                                    opened={isMenuOpen}
                                    onOpen={() => toggleMenu(true)}
                                    onClose={() => toggleMenu(false)}
                                >
                                    <Menu.Dropdown>
                                        {extraMenuItems}
                                        {isEditMode && extraMenuItems && (
                                            <Menu.Divider />
                                        )}
                                        {isEditMode && (
                                            <>
                                                <Box>
                                                    <Menu.Item
                                                        icon={
                                                            <MantineIcon
                                                                icon={IconEdit}
                                                            />
                                                        }
                                                        onClick={() =>
                                                            setIsEditingTileContent(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Edit tile content
                                                    </Menu.Item>
                                                </Box>
                                                {tabs && tabs.length > 1 && (
                                                    <Menu.Item
                                                        icon={
                                                            <MantineIcon
                                                                icon={
                                                                    IconArrowAutofitContent
                                                                }
                                                            />
                                                        }
                                                        onClick={() =>
                                                            setIsMovingTabs(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Move to another tab
                                                    </Menu.Item>
                                                )}
                                                <Menu.Divider />
                                                {belongsToDashboard ? (
                                                    <Menu.Item
                                                        color="red"
                                                        onClick={() =>
                                                            setIsDeletingChartThatBelongsToDashboard(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Delete chart
                                                    </Menu.Item>
                                                ) : (
                                                    <Menu.Item
                                                        color="red"
                                                        icon={
                                                            <MantineIcon
                                                                icon={IconTrash}
                                                            />
                                                        }
                                                        onClick={() =>
                                                            onDelete(tile)
                                                        }
                                                    >
                                                        Remove tile
                                                    </Menu.Item>
                                                )}
                                            </>
                                        )}
                                    </Menu.Dropdown>

                                    <Menu.Target>
                                        <ActionIcon
                                            size="sm"
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                            }}
                                        >
                                            <MantineIcon
                                                data-testid="tile-icon-more"
                                                icon={IconDots}
                                            />
                                        </ActionIcon>
                                    </Menu.Target>
                                </Menu>
                            )}
                        </>
                    ) : null}
                </Group>
            </HeaderContainer>

            <ChartContainer
                className="non-draggable sentry-block ph-no-capture"
                onMouseEnter={
                    hideTitle ? chartHoveredProps.handleMouseEnter : undefined
                }
                onMouseLeave={
                    hideTitle ? chartHoveredProps.handleMouseLeave : undefined
                }
            >
                {children}
            </ChartContainer>

            {isEditingTileContent &&
                (tile.type === DashboardTileTypes.SAVED_CHART ||
                tile.type === DashboardTileTypes.SQL_CHART ? (
                    <ChartUpdateModal
                        opened={isEditingTileContent}
                        tile={tile}
                        onClose={() => setIsEditingTileContent(false)}
                        onConfirm={(newTitle, newUuid, shouldHideTitle) => {
                            onEdit({
                                ...tile,
                                properties: {
                                    ...tile.properties,
                                    title: newTitle,
                                    savedChartUuid: newUuid,
                                    hideTitle: shouldHideTitle,
                                },
                            });
                            setIsEditingTileContent(false);
                        }}
                        hideTitle={!!hideTitle}
                    />
                ) : (
                    <TileUpdateModal
                        className="non-draggable"
                        opened={isEditingTileContent}
                        tile={tile}
                        onClose={() => setIsEditingTileContent(false)}
                        onConfirm={(newTile) => {
                            onEdit(newTile);
                            setIsEditingTileContent(false);
                        }}
                    />
                ))}

            <DeleteChartTileThatBelongsToDashboardModal
                className={'non-draggable'}
                name={chartName ?? ''}
                opened={isDeletingChartThatBelongsToDashboard}
                onClose={() => setIsDeletingChartThatBelongsToDashboard(false)}
                onConfirm={() => {
                    onDelete(tile);
                    setIsDeletingChartThatBelongsToDashboard(false);
                }}
            />
            <MoveTileToTabModal
                className="non-draggable"
                opened={isMovingTabs}
                onConfirm={(newTile) => {
                    onEdit(newTile as T);
                    setIsMovingTabs(false);
                }}
                tabs={tabs}
                tile={tile}
                onClose={() => setIsMovingTabs(false)}
            />
        </Card>
    );
};

export default TileBase;
