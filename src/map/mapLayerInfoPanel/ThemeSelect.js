import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';
import Select from '../../filters/Select';

/* Селект темы слоя */
class ThemeSelect extends React.Component {

    getLayerThemes() {
        const {
            layerId,
            layersById,
        } = this.props;

        const layerConfig = layersById[layerId];

        return layerConfig && layerConfig.themes || [];
    }

    getSelectedThemeId(layerThemes) {
        // В selectedThemeIds собраны ID тем разных слоёв - нужно вычленить ту, которая соответствует данному слою (если есть)

        const { selectedThemeIds } = this.props;

        if (!selectedThemeIds) return null;

        for (let selectedThemeId of selectedThemeIds) {
            for (let theme of layerThemes) {
                if (theme.id === selectedThemeId) {
                    return selectedThemeId;
                }
            }
        }

        return null;
    }

    onItemClick = ({ value }) => {
        this.enableLayer();

        const newThemeId = +value;

        const {
            selectedThemeIds, dispatch,
        } = this.props;

        const layerThemes = this.getLayerThemes();

        // В selectedThemeIds хранятся выбранные темы ВСЕХ слоёв.
        // Необходимо найти среди них и удалить предыдущую включённую тему данного слоя (если есть)
        const newSelectedThemeIds = selectedThemeIds.slice();
        let prevSelectedLayerThemeId = null;
        for (let theme of layerThemes) {
            const itemIndex = selectedThemeIds.indexOf(theme.id);
            if (~itemIndex) { // item is found
                prevSelectedLayerThemeId = theme.id;
                newSelectedThemeIds.splice(itemIndex, 1);
                break;
            }
        }

        newSelectedThemeIds.push(newThemeId);

        dispatch(
            mapPageActionCreators.layers.setThemes({
                themeIds: newSelectedThemeIds,
            })
        );
    }

    enableLayer() {
        // При изменении контрола включить слой, если не включён

        const { layerId, visibleLayerIds, layersById, references, dispatch } = this.props;

        if (~visibleLayerIds.indexOf(layerId)) return;

        dispatch(
            mapPageActionCreators.layers.toggleLayers({
                layerIds: [ layerId ],
                layersById, references, visibleLayerIds,
            })
        );
    }

    render() {
        const layerThemes = this.getLayerThemes();

        // Не отображать селект темы, когда она одна
        if (layerThemes.length === 1) return null;

        let selectedItemId = this.getSelectedThemeId(layerThemes);
        const items = [];
        for (let theme of layerThemes) {
            const item = {
                id: theme.id,
                name: theme.label,
            };
            items.push(item);
            if ((selectedItemId === null || selectedItemId === undefined) && theme.isDefault) {
                selectedItemId = theme.id;
            }
        }

        return (
            <Select items={items} value={selectedItemId} canBeEmpty={false} emptyItemLabel="" onItemClick={this.onItemClick}
                classes={{ root: 'map_filter_select_root' }}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        layerId: state.mapPage.layers.infoLayerId,
        layersById: state.mapPage.layers.layersById,
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
        selectedThemeIds: state.mapPage.layers.selectedThemeIds,
        references: state.mapPage.layers.references,
    };
}

export default connect(mapStateToProps)(ThemeSelect);
